import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReclutamientoScreen } from '../components/screens/ReclutamientoScreen';
import { useScreenNavigate } from '../hooks/useScreenNavigate';

/** Selección de Personal → "/reclutamiento" y "/reclutamiento/:jobCode" (puesto que se está cubriendo) */
export default function Reclutamiento() {
  const { jobCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { goScreen, goTo } = useScreenNavigate();

  return (
    <ReclutamientoScreen
      onNavigate={goScreen}
      onNavigateToJob={(code) => goTo(`/puestos/${code}`)}
      selectedJobCode={jobCode}
      onChangeJobCode={(code) => navigate(`/reclutamiento/${code}`, { replace: true, state: location.state })}
    />
  );
}
