import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PuestosScreen } from '../components/screens/PuestosScreen';
import { JOB_POSITIONS } from '../data/mockData';
import { useScreenNavigate } from '../hooks/useScreenNavigate';
import { useToast } from '../components/ToastProvider';

/** Puestos y Perfiles → "/puestos" y "/puestos/:jobCode" (puesto seleccionado) */
export default function Puestos() {
  const { jobCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { goScreen, goTo } = useScreenNavigate();
  const { showToast } = useToast();

  return (
    <PuestosScreen
      onNavigate={goScreen}
      selectedJobCode={jobCode}
      onChangeJobCode={(code) => navigate(`/puestos/${code}`, { replace: true, state: location.state })}
      onSelectJobForRecruitment={(code) => {
        const job = JOB_POSITIONS.find((j) => j.code === code);
        showToast(`Vacante creada para ${job?.title ?? code}. Ya podés ver a los candidatos recomendados.`);
        goTo(`/reclutamiento/${code}`);
      }}
    />
  );
}
