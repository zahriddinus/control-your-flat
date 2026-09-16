export const Loading = () => {
  return (
    <div
      className="d-flex justify-content-center align-items-center flex-column"
      style={{ height: "90vh" }}
    >
      <div
        className="spinner-grow text-primary mb-3"
        style={{ width: "3rem", height: "3rem" }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>

      <h3 className="text-primary">Loading...</h3>
    </div>
  );
};
