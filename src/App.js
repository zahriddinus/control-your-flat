import "./App.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollTopButton } from "./components/ScrollTopButton";
import { BottomNav } from "./components/BottomNav";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineBanner } from "./components/OfflineBanner";
import { AppRoutes } from "./routes";

function App() {
  return (
    <div className="App">
      <OfflineBanner />

      <Header />

      <AppRoutes />

      <Footer />

      <ScrollTopButton />

      {/* Telefonda pastki menyu va "Ilovani o'rnating" taklifi */}
      <BottomNav />

      <InstallPrompt />
    </div>
  );
}

export default App;
