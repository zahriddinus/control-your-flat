import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { UserModal } from "../../components/UserModal/UserModal";

export const ControlUsers = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  // MODAL
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  function handleEdit(user) {
    setSelectedUser(user);
    setEditModal(true);
  }

  function handleAddUser() {
    setSelectedUser(null);
    setEditModal(true);
  }

  // GET USERS
  async function addUser() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("duty_order", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setData(data);
  }

  // ADD / EDIT
  async function handleModalSubmit(formData) {
    const dutyOrder = Number(formData.dutyOrder);

    // -------------------------
    // EDIT USER
    // -------------------------
    if (selectedUser) {
      // Avval oddiy ma'lumotlarni update qilamiz
      const { error: userError } = await supabase
        .from("users")
        .update({
          role: formData.role,
          name: formData.name,
          last_name: formData.lastName,
          age: Number(formData.age),
        })
        .eq("user_id", selectedUser.user_id);

      if (userError) {
        console.log(userError);
        return;
      }

      // Duty order o'zgargan bo'lsa
      if (dutyOrder && dutyOrder !== selectedUser.duty_order) {
        const { error: orderError } = await supabase.rpc("move_user_to_order", {
          p_user_id: selectedUser.user_id,
          p_new_order: dutyOrder,
        });

        if (orderError) {
          console.log(orderError);
          return;
        }
      }
    }

    // -------------------------
    // ADD USER
    // -------------------------
    else {
      // Hozirgi maksimal order
      const maxOrder = data.length > 0 ? Math.max(...data.map((user) => user.duty_order || 0)) : 0;

      // Admin order kiritmagan bo'lsa,
      // oxiriga qo'shamiz
      const newOrder = dutyOrder > 0 ? dutyOrder : maxOrder + 1;

      // Agar yangi user o'rtaga kirayotgan bo'lsa,
      // undan keyingi userlarni suramiz
      if (newOrder <= maxOrder) {
        const { error: shiftError } = await supabase.rpc("shift_users_for_insert", {
          p_new_order: newOrder,
        });

        if (shiftError) {
          console.log(shiftError);
          return;
        }
      }

      // Yangi user
      const { error: insertError } = await supabase.from("users").insert([
        {
          role: formData.role,
          name: formData.name,
          last_name: formData.lastName,
          age: Number(formData.age),
          duty_order: newOrder,
        },
      ]);

      if (insertError) {
        console.log(insertError);
        return;
      }
    }

    setEditModal(false);
    setSelectedUser(null);

    await addUser();
  }

  // DELETE
  async function handleDelete(user) {
    const confirmDelete = window.confirm(
      `Are we sure we want to delete ${user.name} ${user.last_name}?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("users").delete().eq("user_id", user.user_id);

    if (error) {
      console.log(error);
      return;
    }

    // O'chirilgan odamdan keyingilarni 1 pog'ona yuqoriga suramiz
    const { error: shiftError } = await supabase.rpc("shift_users_after_delete", {
      p_deleted_order: user.duty_order,
    });

    if (shiftError) {
      console.log(shiftError);
      return;
    }

    await addUser();
  }

  const checkAdmin = window.localStorage.getItem("isAdmin");

  function handleExit() {
    if (checkAdmin) {
      window.localStorage.removeItem("isAdmin");
    }

    navigate(0);
  }

  useEffect(() => {
    if (!checkAdmin) {
      navigate("/");
    }
  }, [checkAdmin, navigate]);

  useEffect(() => {
    addUser();
  }, []);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  return (
    <div className="container">
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="p-2" type="button" onClick={handleAddUser}>
            Add User
          </button>

          <h3>{formatDate(new Date())}</h3>

          <button className="p-2" type="button" onClick={handleExit}>
            Exit
          </button>
        </div>

        <table className="table table-info table-striped border">
          <thead>
            <tr>
              <th>#</th>
              <th>First</th>
              <th>Last</th>
              <th>Age</th>
              <th>Duty Order</th>
              <th>Changes</th>
            </tr>
          </thead>

          <tbody>
            {data.map((user) => (
              <tr key={user.user_id}>
                <th>{user.duty_order}</th>

                <td>{user.name}</td>

                <td>{user.last_name}</td>

                <td>{user.age}</td>

                <td>{user.duty_order}</td>

                <td>
                  <button type="button" onClick={() => handleEdit(user)}>
                    Edit
                  </button>

                  <button type="button" onClick={() => handleDelete(user)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal
        isOpen={editModal}
        onClose={() => {
          setEditModal(false);
          setSelectedUser(null);
        }}
        selectedUser={selectedUser}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};
