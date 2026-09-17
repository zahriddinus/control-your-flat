import "./users.scss";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabese";
import { Loading } from "../../components/Loading";

export const Users = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const getUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("user_id", { ascending: true });

      if (error) {
        console.log(error);

        return;
      }

      setData(data);
    };

    getUsers();
  }, []);

  console.log(data);

  return (
    <>
      {data.length ? (
        <div className="container">
          <h1>Users</h1>

          <table className="table table-info table-striped  border">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">First</th>
                <th scope="col">Last</th>
                <th scope="col">Age</th>
                <th scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => (
                <tr key={user.user_id}>
                  <th scope="row">{index + 1}</th>
                  <td>{user.name}</td>
                  <td>{user.last_name}</td>
                  <td>{user.age}</td>
                  <td>{user.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
};
