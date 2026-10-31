import "./controlUsers.scss";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { UserModal } from "../../components/UserModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Avatar } from "../../components/Avatar";
import { Loading } from "../../components/Loading";
import { Notice, useNotice } from "../../components/Notice";
import { addDays, formatUzDate } from "../../utils/date";
import { fetchSchedules } from "../../utils/schedule";
import { StatsCards } from "./StatsCards";
import { UsersTable } from "./UsersTable";
import { UserCards } from "./UserCards";

export const ControlUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [weekSchedules, setWeekSchedules] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Navbat o'zgarayotganda boshqa amallar vaqtincha o'chadi
  const [busy, setBusy] = useState(false);

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

    if (error) showNotice("Ro'yxatni yangilab bo'lmadi. Sahifani yangilang.", "danger");
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

  const todayDutyId = weekSchedules[0]?.duty?.user_id;

  const maxOrder = users.length ? Math.max(...users.map((user) => user.duty_order || 0)) : 0;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.last_name, user.nickname, user.phone_number, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [users, search]);

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
        showNotice(`Saqlab bo'lmadi: ${userError.message}`, "danger");
        return;
      }

      // Duty order o'zgargan bo'lsa
      if (dutyOrder && dutyOrder !== selectedUser.duty_order) {
        const { error: orderError } = await supabase.rpc("move_user_to_order", {
          p_user_id: selectedUser.user_id,
          p_new_order: dutyOrder,
        });

        if (orderError) {
          console.error(orderError);
          showNotice(`Ma'lumotlar saqlandi, lekin navbatni o'zgartirib bo'lmadi.`, "warning");
          closeUserModal();
          await refreshUsers();
          return;
        }
      }

      showNotice(`✅ ${formData.name} ma'lumotlari saqlandi`);
    }

    // ADD USER
    else {
      // Admin order kiritmagan bo'lsa, oxiriga qo'shamiz
      const newOrder = dutyOrder > 0 ? dutyOrder : maxOrder + 1;

      // Agar yangi user o'rtaga kirayotgan bo'lsa, undan keyingi userlarni suramiz
      if (newOrder <= maxOrder) {
        const { error: shiftError } = await supabase.rpc("shift_users_for_insert", {
          p_new_order: newOrder,
        });

        if (shiftError) {
          console.error(shiftError);
          showNotice(`Qo'shib bo'lmadi: ${shiftError.message}`, "danger");
          return;
        }
      }

      const { error: insertError } = await supabase
        .from("users")
        .insert([{ ...fields, duty_order: newOrder }]);

      if (insertError) {
        console.error(insertError);
        showNotice(`Qo'shib bo'lmadi: ${insertError.message}`, "danger");
        return;
      }

      showNotice(`✅ ${formData.name} qo'shildi (${newOrder}-o'rin)`);
    }

    closeUserModal();
    await refreshUsers();
  }

  // MOVE (sudrash yoki ↑ ↓)

  // Raqamlar ketma-ket bo'lmasligi mumkin (masalan 1, 21, 22),
  // shuning uchun ↑ ↓ qo'shni userning o'rniga suradi
  function handleMoveStep(user, direction) {
    const index = users.findIndex((item) => item.user_id === user.user_id);
    const neighbor = users[index + direction];

    if (neighbor) handleMove(user, neighbor.duty_order);
  }

  async function handleMove(user, newOrder) {
    if (busy || newOrder === user.duty_order || newOrder < 1 || newOrder > maxOrder) return;

    setBusy(true);

    const { error } = await supabase.rpc("move_user_to_order", {
      p_user_id: user.user_id,
      p_new_order: newOrder,
    });

    if (error) {
      console.error(error);
      showNotice(`Navbatni o'zgartirib bo'lmadi: ${error.message}`, "danger");
    } else {
      showNotice(`↕️ ${user.name} endi ${newOrder}-o'rinda`);
    }

    await refreshUsers();
    setBusy(false);
  }

  // DELETE

  async function handleDeleteConfirm() {
    const user = userToDelete;

    setDeleting(true);

    // O'chirish va keyingilarni surish bitta tranzaksiyada bajariladi:
    // biri xato bersa, ikkalasi ham bekor bo'ladi
    const { error } = await supabase.rpc("delete_user_and_shift", {
      p_user_id: user.user_id,
    });

    if (error) {
      console.error(error);
      showNotice(`O'chirib bo'lmadi: ${error.message}`, "danger");
      setDeleting(false);
      return;
    }

    showNotice(`🗑️ ${user.name} ${user.last_name} o'chirildi`);

    setDeleting(false);
    setUserToDelete(null);
    await refreshUsers();
  }

  const cancelDelete = useCallback(() => setUserToDelete(null), []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container pt-3">
        <div className="alert alert-danger">
          Userlarni yuklab bo'lmadi. Sahifani yangilab ko'ring.
        </div>
      </div>
    );
  }

  const renderUsers = () => {
    if (!users.length) {
      return (
        <div className="alert alert-info">
          Hali hech kim qo'shilmagan. "+ Add User" tugmasini bosing.
        </div>
      );
    }

    if (!filteredUsers.length) {
      return <div className="alert alert-secondary">"{search}" bo'yicha hech kim topilmadi.</div>;
    }

    const listProps = {
      users: filteredUsers,
      todayDutyId,
      currentUserId,
      busy,
      onMove: handleMove,
      onEdit: handleEdit,
      onDelete: setUserToDelete,
    };

    return (
      <>
        <UsersTable {...listProps} />
        <UserCards
          {...listProps}
          firstUserId={users[0]?.user_id}
          lastUserId={users[users.length - 1]?.user_id}
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
            <h1 className="control__title fw-bold m-0">⚙️ Control Users</h1>

            <small className="text-muted">{formatUzDate(today)}</small>
          </div>

          <div className="d-flex gap-2">
            <input
              type="search"
              className="control__search form-control"
              placeholder="Qidirish..."
              aria-label="Userlarni qidirish"
              value={search}
              onChange={(evt) => setSearch(evt.target.value)}
            />

            <button
              className="control__add-btn btn btn-primary text-nowrap"
              type="button"
              onClick={handleAddUser}
            >
              + Add User
            </button>
          </div>
        </div>

        <StatsCards users={users} schedules={weekSchedules} />

        <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
          <span className="d-none d-md-inline">
            💡 Navbatni o'zgartirish uchun qatorni sudrab, boshqa qator ustiga qo'ying.
          </span>

          <span className="d-md-none">💡 Navbatni ↑ ↓ tugmalari bilan o'zgartiring.</span>

          {busy && (
            <span className="text-primary text-nowrap ms-2">
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              Saqlanmoqda...
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
        isOpen={!!userToDelete}
        title="🗑️ Userni o'chirish"
        confirmLabel="O'chirish"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={cancelDelete}
      >
        {userToDelete && (
          <div className="d-flex align-items-center gap-3">
            <Avatar user={userToDelete} />

            <div>
              <p className="m-0">
                <strong>
                  {userToDelete.name} {userToDelete.last_name}
                </strong>
                ni o'chirasizmi?
              </p>

              <small className="text-muted">
                Bu amalni ortga qaytarib bo'lmaydi. Undan keyingilarning navbati bittaga suriladi.
              </small>
            </div>
          </div>
        )}
      </ConfirmModal>

      <Notice notice={notice} />
    </div>
  );
};
