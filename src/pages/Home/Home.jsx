import { useRef } from 'react';
import { supabase } from '../../lib/supabese';

export const Home = () => {
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
      const { data, error } = await supabase.from('users').insert(newUser).select();

      if (error) {
        console.error(error);
        return;
      }
      console.log(data);
    }

    addUser();
  }

  return (
    <div>
      <form className="" onSubmit={handleForm}>
        <select ref={roleRef}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <input ref={nameRef} type="text" placeholder="Name..." />
        <input ref={lastNameRef} type="text" placeholder="Last Name..." />
        <input ref={ageRef} type="type" placeholder="Age..." />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
