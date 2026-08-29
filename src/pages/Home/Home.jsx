import { supabase } from '../../lib/supabese';

const { data, error } = await supabase.from('users').select('*');

console.log('DATA:', data);
console.log('ERROR:', error);

export const Home = () => {
  return (
    <div className="container">
      <h1>
        Assalomu aleykum, <span>Zahriddin</span>
      </h1>
    </div>
  );
};
