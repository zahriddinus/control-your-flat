import "./controlUsers.scss";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { UserModal } from "../../components/UserModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Avatar } from "../../components/Avatar";
import { PageSkeleton } from "../../components/Skeleton";
import { EmptyState, ErrorState } from "../../components/EmptyState";
import { Notice, useNotice } from "../../components/Notice";
import { TaskIcon } from "../../components/TaskIcon";
import { AppIcon } from "../../components/AppIcon";
import { useI18n } from "../../i18n";
import { addDays, formatLongDate } from "../../utils/date";
import { TASKS, fetchSchedules, sortUsersByOrder } from "../../utils/schedule";
import { StatsCards } from "./StatsCards";
import { UsersTable } from "./UsersTable";
import { UserCards } from "./UserCards";

export const ControlUsers = () => {
  const { t, lang } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [weekSchedules, setWeekSchedules] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Qaysi vazifaning tartibi ko'rsatilmoqda: har birining o'z tartibi bor
  const [orderTask, setOrderTask] = useState("duty");

  // Navbat o'zgarayotganda boshqa amallar vaqtincha o'chadi
  const [busy, setBusy] = useState(false);

  // O'rin almashtirish: birinchi tanlangan odam, keyin tasdiqlanadigan juftlik
  const [swapSource, setSwapSource] = useState(null);
  const [swapPair, setSwapPair] = useState(null);
  const [swapping, setSwapping] = useState(false);

  // MODALS
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [notice, showNotice] = useNotice(3500);

  const today = useMemo(() => new Date(), []);

  // GET USERS

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("duty_order", { ascending: true });

    if (error) {
      console.error(error);
      return error;
    }

    setUsers(data);
    return null;
  }, []);

  useEffect(() => {
    const init = async () => {
      setError(await loadUsers());
      setLoading(false);
    };

    init();
  }, [loadUsers]);

  async function refreshUsers() {
    const error = await loadUsers();

    if (error) showNotice(t("control.refreshError"), "danger");
  }

  // O'zini o'chirib qo'ymasligi uchun hozirgi admin kimligini bilamiz
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
  }, []);

  // Statistika va bugungi navbatchi uchun 7 kunlik navbatlar.
  // Tartib o'zgarsa, navbatchilar ham o'zgaradi, shuning uchun users'ga bog'liq
  useEffect(() => {
    if (!users.length) return;

    let cancelled = false;

    const getWeekSchedules = async () => {
      try {
        const result = await fetchSchedules(
          Array.from({ length: 7 }, (_, index) => addDays(today, index))
        );

        if (!cancelled) setWeekSchedules(result);
      } catch (error) {
        console.error("Schedules error:", error);
      }
    };

    getWeekSchedules();

    return () => {
      cancelled = true;
    };
  }, [users, today]);

  const orderTaskDef = TASKS.find((task) => task.key === orderTask);
  const orderColumn = orderTaskDef.orderColumn;

  // Tanlangan tabdagi vazifada bugun kim turibdi (musor va uborka har kuni bo'lmaydi)
  const todayIds = users
    .filter((user) => orderTaskDef.isAssigned(weekSchedules[0], user.user_id))
    .map((user) => user.user_id);
  const orderTaskTitle = t(`tasks.${orderTask}.title`);

  const sortedUsers = useMemo(() => sortUsersByOrder(users, orderColumn), [users, orderColumn]);

  const maxOrder = users.length ? Math.max(...users.map((user) => user[orderColumn] || 0)) : 0;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sortedUsers;

    return sortedUsers.filter((user) =>
      [user.name, user.last_name, user.nickname, user.phone_number, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [sortedUsers, search]);

  function changeOrderTask(taskKey) {
    setOrderTask(taskKey);
    setSwapSource(null);
  }

  // MODAL

  function handleAddUser() {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  }

  function handleEdit(user) {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  }

  const closeUserModal = useCallback(() => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  }, []);

  // ADD / EDIT

  async function handleModalSubmit(formData) {
    const dutyOrder = Number(formData.dutyOrder);

    const fields = {
      role: formData.role,
      name: formData.name,
      last_name: formData.lastName,
      age: Number(formData.age),
      nickname: formData.nickname,
      phone_number: formData.phoneNumber,
      email: formData.email,
    };

    // EDIT USER
    if (selectedUser) {
      const { error: userError } = await supabase
        .from("users")
        .update(fields)
        .eq("user_id", selectedUser.user_id);

      if (userError) {
        console.error(userError);
        showNotice(t("control.notices.saveError", { error: userError.message }), "danger");
        return;
      }

      // Oynadagi "navbatdagi o'rni" - navbatchilik tartibi
      if (dutyOrder && dutyOrder !== selectedUser.duty_order) {
        const { error: orderError } = await supabase.rpc("move_user_in_order", {
          p_task: "duty",
          p_user_id: selectedUser.user_id,
          p_new_order: dutyOrder,
        });

        if (orderError) {
          console.error(orderError);
          showNotice(t("control.notices.savedButOrder"), "warning");
          closeUserModal();
          await refreshUsers();
          return;
        }
      }

      showNotice(t("control.notices.saved", { name: formData.name }));
    }

    // ADD USER: surish, qo'shish va tarixni saqlash bitta tranzaksiyada
    else {
      const { data: newOrder, error: insertError } = await supabase.rpc("add_user", {
        p_user: fields,
        p_duty_order: dutyOrder > 0 ? dutyOrder : null,
      });

      if (insertError) {
        console.error(insertError);
        showNotice(t("control.notices.addError", { error: insertError.message }), "danger");
        return;
      }

      showNotice(t("control.notices.added", { name: formData.name, order: newOrder }));
    }

    closeUserModal();
    await refreshUsers();
  }

  // MOVE (sudrash yoki ↑ ↓) - tanlangan vazifa tartibida

  // ↑ ↓ qo'shni userning o'rniga suradi
  function handleMoveStep(user, direction) {
    const index = sortedUsers.findIndex((item) => item.user_id === user.user_id);
    const neighbor = sortedUsers[index + direction];

    if (neighbor) handleMove(user, neighbor[orderColumn]);
  }

  async function handleMove(user, newOrder) {
    if (busy || newOrder === user[orderColumn] || newOrder < 1 || newOrder > maxOrder) return;

    setBusy(true);
    setSwapSource(null);

    const { error } = await supabase.rpc("move_user_in_order", {
      p_task: orderTask,
      p_user_id: user.user_id,
      p_new_order: newOrder,
    });

    if (error) {
      console.error(error);
      showNotice(t("control.notices.moveError", { error: error.message }), "danger");
    } else {
      showNotice(t("control.notices.moved", { name: user.name, order: newOrder }));
    }

    await refreshUsers();
    setBusy(false);
  }

  // SWAP: birinchi bosilgan - manba, ikkinchisi bosilganda tasdiqlash oynasi

  function handleSwap(user) {
    if (!swapSource) {
      setSwapSource(user);
      return;
    }

    if (swapSource.user_id === user.user_id) {
      setSwapSource(null);
      return;
    }

    setSwapPair([swapSource, user]);
  }

  async function handleSwapConfirm() {
    const [first, second] = swapPair;

    setSwapping(true);

    const { error } = await supabase.rpc("swap_users_in_order", {
      p_task: orderTask,
      p_user_a: first.user_id,
      p_user_b: second.user_id,
    });

    if (error) {
      console.error(error);
      showNotice(t("control.notices.swapError", { error: error.message }), "danger");
    } else {
      showNotice(t("control.notices.swapped", { a: first.name, b: second.name }));
    }

    setSwapping(false);
    setSwapPair(null);
    setSwapSource(null);
    await refreshUsers();
  }

  const cancelSwap = useCallback(() => setSwapPair(null), []);

  // DELETE

  async function handleDeleteConfirm() {
    const user = userToDelete;

    setDeleting(true);

    // O'chirish, uchala tartibdagi bo'shliqni yopish va tarixni saqlash bitta tranzaksiyada
    const { error } = await supabase.rpc("delete_user_and_shift", {
      p_user_id: user.user_id,
    });

    if (error) {
      console.error(error);
      showNotice(t("control.notices.deleteError", { error: error.message }), "danger");
      setDeleting(false);
      return;
    }

    showNotice(t("control.notices.deleted", { name: `${user.name} ${user.last_name}` }));

    setDeleting(false);
    setUserToDelete(null);
    await refreshUsers();
  }

  const cancelDelete = useCallback(() => setUserToDelete(null), []);

  if (loading) {
    return <PageSkeleton variant="control" />;
  }

  if (error) {
    return (
      <div className="container pt-3">
        <ErrorState text={t("control.loadError")} />
      </div>
    );
  }

  const renderUsers = () => {
    if (!users.length) {
      return <EmptyState variant="noUsers" text={t("control.empty", { add: t("control.add") })} />;
    }

    if (!filteredUsers.length) {
      return (
        <EmptyState variant="notFound" text={t("control.notFound", { query: search })} compact />
      );
    }

    const listProps = {
      users: filteredUsers,
      orderColumn,
      todayIds,
      todayTaskKey: orderTask,
      pairMode: orderTask === "cleaning",
      currentUserId,
      busy,
      swapSourceId: swapSource?.user_id,
      onMove: handleMove,
      onSwap: handleSwap,
      onEdit: handleEdit,
      onDelete: setUserToDelete,
    };

    return (
      <>
        <UsersTable {...listProps} />
        <UserCards
          {...listProps}
          firstUserId={sortedUsers[0]?.user_id}
          lastUserId={sortedUsers[sortedUsers.length - 1]?.user_id}
          onMoveStep={handleMoveStep}
        />
      </>
    );
  };

  return (
    <div className="control">
      <div className="container py-3 py-md-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div className="text-start">
            <h1 className="control__title d-flex align-items-center gap-2 fw-bold m-0">
              <span className="control__title-icon" aria-hidden="true">
                <AppIcon name="sliders" />
              </span>
              {t("nav.controlUsers")}
            </h1>

            <small className="text-muted">{formatLongDate(today, lang)}</small>
          </div>

          <div className="d-flex gap-2">
            <input
              type="search"
              className="control__search form-control"
              placeholder={t("control.searchPlaceholder")}
              aria-label={t("control.searchAria")}
              value={search}
              onChange={(evt) => setSearch(evt.target.value)}
            />

            <button
              className="control__add-btn btn btn-primary text-nowrap"
              type="button"
              onClick={handleAddUser}
            >
              {t("control.add")}
            </button>
          </div>
        </div>

        <StatsCards users={users} schedules={weekSchedules} />

        {/* QAYSI VAZIFA TARTIBI */}

        <div
          className="control__tabs btn-group mb-2"
          role="group"
          aria-label={t("control.orderTabsLabel")}
        >
          {TASKS.map((task) => (
            <button
              key={task.key}
              type="button"
              className={`control__tab btn d-inline-flex align-items-center justify-content-center gap-2 ${
                orderTask === task.key ? "active" : ""
              }`}
              onClick={() => changeOrderTask(task.key)}
              aria-pressed={orderTask === task.key}
            >
              <TaskIcon taskKey={task.key} />
              {t(`tasks.${task.key}.title`)}
            </button>
          ))}
        </div>

        <p className="control__hint small text-muted text-start mb-3">
          <AppIcon name="bulb" className="control__hint-icon" />
          {t("control.orderHint")}
        </p>

        {orderTask === "cleaning" && (
          <p className="control__hint control__hint--pairs small text-start mb-3">
            <TaskIcon taskKey="cleaning" />
            {t("control.pairHint")}
          </p>
        )}

        {swapSource && (
          <div className="control__swap-banner alert alert-primary d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
            <span>
              {t("control.swapPick", { name: `${swapSource.name} ${swapSource.last_name}` })}
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setSwapSource(null)}
            >
              {t("common.cancel")}
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
          <span className="control__hint d-none d-md-inline">
            <AppIcon name="bulb" className="control__hint-icon" />
            {t("control.dragHint")}
          </span>

          <span className="control__hint d-md-none">
            <AppIcon name="bulb" className="control__hint-icon" />
            {t("control.arrowsHint")}
          </span>

          {busy && (
            <span className="text-primary text-nowrap ms-2">
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {t("control.saving")}
            </span>
          )}
        </div>

        {renderUsers()}
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        selectedUser={selectedUser}
        onSubmit={handleModalSubmit}
        users={users}
      />

      <ConfirmModal
        isOpen={!!swapPair}
        title={t("control.swapModal.title")}
        icon="swap"
        confirmLabel={t("control.swapModal.confirm")}
        confirmVariant="primary"
        loading={swapping}
        onConfirm={handleSwapConfirm}
        onCancel={cancelSwap}
      >
        {swapPair && (
          <div>
            <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
              <span className="text-center">
                <Avatar user={swapPair[0]} />
                <small className="d-block mt-1">#{swapPair[0][orderColumn]}</small>
              </span>

              <span className="control__swap-arrow" aria-hidden="true">
                ⇄
              </span>

              <span className="text-center">
                <Avatar user={swapPair[1]} />
                <small className="d-block mt-1">#{swapPair[1][orderColumn]}</small>
              </span>
            </div>

            <p className="m-0 fw-semibold text-center">
              {t("control.swapModal.question", {
                a: `${swapPair[0].name} ${swapPair[0].last_name}`,
                b: `${swapPair[1].name} ${swapPair[1].last_name}`,
              })}
            </p>

            <small className="d-block text-muted text-center mt-1">
              {t("control.swapModal.task", { task: orderTaskTitle })}
            </small>
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!userToDelete}
        title={t("control.deleteModal.title")}
        icon="trash"
        confirmLabel={t("control.deleteModal.confirm")}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={cancelDelete}
      >
        {userToDelete && (
          <div className="d-flex align-items-center gap-3">
            <Avatar user={userToDelete} />

            <div>
              <p className="m-0 fw-semibold">
                {t("control.deleteModal.question", {
                  name: `${userToDelete.name} ${userToDelete.last_name}`,
                })}
              </p>

              <small className="text-muted">{t("control.deleteModal.warning")}</small>
            </div>
          </div>
        )}
      </ConfirmModal>

      <Notice notice={notice} />
    </div>
  );
};
