import { useState } from "react";
import { supabase } from "../../lib/supabese";

export const Modal = () => {
  const [data, setData] = useState([]);

  // EDIT:
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");

  async function handleUpdate() {
    if (!selectedUser) return;

    const updatedUser = {
      role,
      name,
      last_name: lastName,
      age: Number(age),
    };

    const { error } = await supabase
      .from("users")
      .update(updatedUser)
      .eq("user_id", selectedUser.user_id);

    if (error) {
      console.log(error);
      return;
    }

    setEditModal(false);
    setSelectedUser(null);

    setRole("");
    setName("");
    setLastName("");
    setAge("");

    await addUser();
  }

  async function handleAddSubmit() {
    const newUser = {
      role,
      name,
      last_name: lastName,
      age: Number(age),
    };

    const { error } = await supabase.from("users").insert([newUser]);

    if (error) {
      console.log(error);
      return;
    }

    setEditModal(false);
    setSelectedUser(null);

    setRole("");
    setName("");
    setLastName("");
    setAge("");

    await addUser();
  }

  async function handleSubmit(evt) {
    evt.preventDefault();

    if (selectedUser) {
      await handleUpdate();
    } else {
      await handleAddSubmit();
    }
  }

  // GET:
  async function addUser() {
    const { data, error } = await supabase.from("users").select();

    if (error) {
      console.error(error);
      return;
    }

    setData(data);
  }

  console.log(data);

  return (
    <div className="container">
      {editModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            aria-labelledby="userModalLabel"
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="userModalLabel">
                    {selectedUser ? "Edit User" : "Add New User"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <select
                      className="form-select mb-3"
                      defaultValue={selectedUser ? selectedUser.role : "user"}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>

                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />

                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />

                    <input
                      type="number"
                      className="form-control mb-3"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditModal(false)}
                      >
                        Close
                      </button>

                      <button type="submit" className="btn btn-primary">
                        {selectedUser ? "Save changes" : "Add User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};
