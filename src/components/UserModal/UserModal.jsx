import { useEffect, useState } from "react";

export const UserModal = ({ isOpen, onClose, selectedUser, onSubmit }) => {
  const [formData, setFormData] = useState({
    role: "",
    name: "",
    lastName: "",
    age: "",
    dutyOrder: "",
    nickname: "",
    phoneNumber: "",
    email: "",
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
        nickname: selectedUser.nickname || "",
        phoneNumber: selectedUser.phone_number || "",
        email: selectedUser.email || "",
      });
    } else {
      setFormData({
        role: "user",
        name: "",
        lastName: "",
        age: "",
        dutyOrder: "",
        nickname: "",
        phoneNumber: "",
        email: "",
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
            <div className="modal-header">
              <h5 className="modal-title fw-semibold text-primary" id="userModalLabel">
                {selectedUser ? "Edit User" : "Add New User"}
              </h5>

              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <select
                  className="form-select mb-3"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin</option>

                  <option value="user">User</option>
                </select>

                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />

                <input
                  type="number"
                  className="form-control mb-3"
                  placeholder="Age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  className="form-control mb-3"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="@username"
                />

                <input
                  type="tel"
                  className="form-control mb-3"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+998 90 123 45 67"
                />

                <input
                  type="email"
                  className="form-control mb-3"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />

                <input
                  type="number"
                  className="form-control"
                  placeholder="Duty  order: 1, 2, 3..."
                  name="dutyOrder"
                  value={formData.dutyOrder}
                  onChange={handleChange}
                  min="1"
                />

                <small className="text-muted d-block mt-1 ms-2" style={{ textAlign: "left" }}>
                  Tartib raqamini bo'sh qoldirsangiz, user oxiriga qo'shiladi.
                </small>

                <div className="modal-footer mt-3">
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
