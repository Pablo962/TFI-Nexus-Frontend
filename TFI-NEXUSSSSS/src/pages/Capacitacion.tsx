import { CapacitacionScreen } from '../components/screens/CapacitacionScreen';
import { useScreenNavigate } from '../hooks/useScreenNavigate';

/** Capacitación → "/capacitacion" */
export default function Capacitacion() {
  const { goScreen, goTo } = useScreenNavigate();
  return <CapacitacionScreen onNavigate={goScreen} onSelectEmployee={(id: string) => goTo(`/personas/${id}`)} />;
}
