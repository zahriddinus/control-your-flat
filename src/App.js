import "./App.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollTopButton } from "./components/ScrollTopButton";
import { AppRoutes } from "./routes";

function App() {
  return (
    <div className="App">
      <Header />

      <AppRoutes />

      <Footer />

      <ScrollTopButton />
    </div>
  );
}

export default App;
