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

  // GET
  async function addUser() {
    const { data, error } = await supabase.from("users").select();

    if (error) {
      console.error(error);
      return;
    }

    setData(data);
  }

  // ADD / EDIT
  async function handleModalSubmit(formData) {
    const userData = {
      role: formData.role,
      name: formData.name,
      last_name: formData.lastName,
      age: Number(formData.age),
    };

    if (selectedUser) {
      const { error } = await supabase
        .from("users")
        .update(userData)
        .eq("user_id", selectedUser.user_id);

      if (error) {
        console.log(error);
        return;
      }
    } else {
      const { error } = await supabase.from("users").insert([userData]);

      if (error) {
        console.log(error);
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
      `Are we sure we want to delete  ${user.name} ${user.last_name}?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("users").delete().eq("user_id", user.user_id);

    if (error) {
      console.log(error);
      return;
    }

    setData((prevData) => prevData.filter((item) => item.user_id !== user.user_id));
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

  return (
    <div className="container">
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="p-2" type="button" onClick={handleAddUser}>
            Add User
          </button>

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
              <th>Email</th>
              <th>Changes</th>
            </tr>
          </thead>

          <tbody>
            {data.map((user, index) => (
              <tr key={user.user_id}>
                <th>{index + 1}</th>
                <td>{user.name}</td>
                <td>{user.last_name}</td>
                <td>{user.age}</td>

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
