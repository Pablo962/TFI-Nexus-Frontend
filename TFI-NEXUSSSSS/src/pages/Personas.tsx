import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmpleadosScreen } from '../components/screens/EmpleadosScreen';
import { EvaluationModal } from '../components/EvaluationModal';
import { EMPLOYEES_DATA } from '../data/mockData';
import { useScreenNavigate } from '../hooks/useScreenNavigate';
import { useToast } from '../components/ToastProvider';

const DEFAULT_EMPLOYEE = 'lucas';

/**
 * Personas → "/personas", "/personas/:employeeId" (ficha) y "/personas/:employeeId/evaluar" (formulario de evaluación).
 * El formulario es una ruta: el botón Atrás del navegador lo cierra.
 */
export default function Personas() {
  const { employeeId, action } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { goScreen } = useScreenNavigate();
  const { showToast } = useToast();

  const activeId = employeeId ?? DEFAULT_EMPLOYEE;
  const evaluating = action === 'evaluar' ? EMPLOYEES_DATA.find((e) => e.id === activeId) : undefined;

  const closeEvaluation = () => {
    // Si el usuario llegó desde la ficha, "Atrás" evita duplicar entradas en el historial.
    if (location.key !== 'default') navigate(-1);
    else navigate(`/personas/${activeId}`, { replace: true });
  };

  return (
    <>
      <EmpleadosScreen
        onNavigate={goScreen}
        selectedEmployeeId={activeId}
        onChangeEmployee={(id) => navigate(`/personas/${id}`, { replace: true, state: location.state })}
        onOpenEvaluationModal={(emp) => navigate(`/personas/${emp.id}/evaluar`, { state: location.state })}
      />
      {evaluating && (
        <EvaluationModal
          employee={evaluating}
          onClose={closeEvaluation}
          onSave={() => {
            showToast(`¡Listo! La evaluación de ${evaluating.name} se guardó correctamente.`, 'success');
            closeEvaluation();
          }}
        />
      )}
    </>
  );
}
