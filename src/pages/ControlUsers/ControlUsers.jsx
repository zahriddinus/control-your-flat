import { useEffect, useRef } from "react";
import { supabase } from "../../lib/supabese";
import { useNavigate } from "react-router-dom";

export const ControlUsers = () => {
  const navigate = useNavigate();
  const roleRef = useRef();
  const nameRef = useRef();
  const lastNameRef = useRef();
  const ageRef = useRef();

  function handleForm(evt) {
    evt.preventDefault();
    console.log(roleRef.current.value);

    const newUser = {
      role: roleRef.current.value,
      name: nameRef.current.value,
      last_name: lastNameRef.current.value,
      age: ageRef.current.value,
    };

    async function addUser() {
      const { data, error } = await supabase.from("users").insert(newUser).select();

      if (error) {
        console.error(error);
        return;
      }
      console.log(data);
    }

    addUser();
  }

  const checkAdmin = window.localStorage.getItem("isAdmin");

  function handleExit() {
    if (checkAdmin) {
      window.localStorage.removeItem("isAdmin");
    }

    console.log("SSSSS");
    navigate("/");
  }

  useEffect(() => {
    if (!checkAdmin) {
      navigate("/");
    }
  }, [checkAdmin, navigate]);

  return (
    <div>
      <form className="" onSubmit={handleForm}>
        <select ref={roleRef} defaultValue={"user"}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <input ref={nameRef} type="text" placeholder="Name..." />
        <input ref={lastNameRef} type="text" placeholder="Last Name..." />
        <input ref={ageRef} type="type" placeholder="Age..." />

        <button type="submit">Submit</button>
      </form>

      <button className="p-2" type="button" onClick={handleExit}>
        Exit
      </button>
    </div>
  );
};
