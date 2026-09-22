import { useEffect, useState } from "react";

export const UserModal = ({ isOpen, onClose, selectedUser, onSubmit }) => {
  const [formData, setFormData] = useState({
    role: "user",
    name: "",
    lastName: "",
    age: "",
    dutyOrder: "",
  });

  // Modal ochilganda yoki user o'zgarganda
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        role: selectedUser.role || "user",
        name: selectedUser.name || "",
        lastName: selectedUser.last_name || "",
        age: selectedUser.age || "",
        dutyOrder: selectedUser.duty_order || "",
      });
    } else {
      setFormData({
        role: "user",
        name: "",
        lastName: "",
        age: "",
        dutyOrder: "",
      });
    }
  }, [selectedUser, isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit(formData);
  }

  if (!isOpen) return null;

  return (
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
            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title" id="userModalLabel">
                {selectedUser ? "Edit User" : "Add New User"}
              </h5>

              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* ROLE */}
                <select
                  className="form-select mb-3"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin</option>

                  <option value="user">User</option>
                </select>

                {/* NAME */}
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                {/* LAST NAME */}
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />

                {/* AGE */}
                <input
                  type="number"
                  className="form-control mb-3"
                  placeholder="Age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />

                {/* DUTY ORDER */}
                <label htmlFor="dutyOrder" className="form-label">
                  Duty order
                </label>

                <input
                  id="dutyOrder"
                  type="number"
                  className="form-control mb-3"
                  placeholder="Masalan: 3"
                  name="dutyOrder"
                  value={formData.dutyOrder}
                  onChange={handleChange}
                  min="1"
                />

                <small className="text-muted">
                  Tartib raqamini bo'sh qoldirsangiz, user oxiriga qo'shiladi.
                </small>

                {/* FOOTER */}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
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
  );
};
