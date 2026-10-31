import './App.css';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AppRoutes } from './routes';

function App() {
  return (
    <div className="App">
      <Header />

      <AppRoutes />

      <Footer />
    </div>
  );
}

export default App;
