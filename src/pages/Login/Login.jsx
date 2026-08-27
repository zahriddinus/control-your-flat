import { useRef } from 'react';
import { supabase } from '../../lib/supabese';

export const Login = () => {
  const roleRef = useRef();
  const nameRef = useRef();
  const lastNameRef = useRef();
  const ageRef = useRef();

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'zahriddinulmasov99@gmail.com',
      password: 'SENING_PASSWORDING',
    });

    if (error) {
      console.error(error);
      return;
    }

    console.log('LOGGED IN:', data.user);
  }

  return (
    <div>
      <button onClick={login}>Login</button>
    </div>
  );
};
