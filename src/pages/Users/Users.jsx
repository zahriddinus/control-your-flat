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
        .order("duty_order", { ascending: true });

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
    <div className="users">
      {data.length ? (
        <div className="container pt-2">
          <h1 className="users__title text-primary m-0 my-2 my-md-3">Users</h1>

          <div className="table-responsive">
            <table className="table table-info table-striped  border">
              <thead>
                <tr className="users__cell">
                  <th scope="col">#</th>
                  <th scope="col">First</th>
                  <th scope="col">Last</th>
                  <th scope="col">Nickname</th>
                  <th scope="col">Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user, index) => (
                  <tr className="users__cell" key={user.user_id}>
                    <th scope="row">{index + 1}</th>
                    <td>{user.name}</td>
                    <td>{user.last_name}</td>
                    <td>
                      {user.nickname ? (
                        <a
                          href={`https://t.me/${user.nickname.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {user.nickname}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {user.phone_number ? (
                        <a href={`tel:${user.phone_number}`}>{user.phone_number}</a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
};
