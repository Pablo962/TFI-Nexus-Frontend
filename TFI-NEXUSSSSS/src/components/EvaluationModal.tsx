import React, { useEffect, useState } from 'react';
import { EmployeeProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { useFocusTrap } from './useFocusTrap';

interface EvaluationModalProps {
  employee: EmployeeProfile;
  onClose: () => void;
  onSave: () => void;
}

const inputClass =
  'w-full p-2.5 bg-surface-container rounded-xl border text-on-surface outline-hidden focus:border-primary text-xs font-semibold';

/** Formulario de evaluación: campos vacíos (sin notas inventadas), obligatorios marcados y errores claros. */
export const EvaluationModal: React.FC<EvaluationModalProps> = ({ employee, onClose, onSave }) => {
  const [technical, setTechnical] = useState('');
  const [teamwork, setTeamwork] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parseScore = (v: string) => Number(v.replace(',', '.'));
  const validScore = (v: string) => v.trim() !== '' && parseScore(v) >= 1 && parseScore(v) <= 5;

  const errors = {
    technical: validScore(technical) ? '' : 'Ingresá una nota entre 1 y 5 (por ejemplo: 4,5).',
    teamwork: validScore(teamwork) ? '' : 'Ingresá una nota entre 1 y 5 (por ejemplo: 4,5).',
    comments: comments.trim().length >= 10 ? '' : 'Escribí al menos una frase con la devolución para el colaborador.',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!hasErrors) onSave();
  };

  const borderFor = (err: string) => (submitted && err ? 'border-error' : 'border-outline-variant/40');
  const FieldError = ({ text }: { text: string }) =>
    submitted && text ? (
      <p role="alert" className="text-[11px] text-error font-semibold mt-1 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
        {text}
      </p>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eval-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">rate_review</span>
            </span>
            <div>
              <h3 id="eval-title" className="text-base font-black text-on-surface">Registrar evaluación de desempeño</h3>
              <p className="text-[11px] text-outline">Puntaje y devolución para el colaborador</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer" title="Cerrar ventana" aria-label="Cerrar ventana">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 text-xs">
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <UserAvatar name={employee.name} size="md" shape="rounded" />
            <div>
              <h4 className="font-bold text-on-surface text-sm">{employee.name}</h4>
              <p className="text-outline text-xs">{employee.role} &bull; {employee.area}</p>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant">Los campos marcados con <span className="text-error font-bold">*</span> son obligatorios.</p>

          <div>
            <label htmlFor="eval-tech" className="font-bold text-on-surface block mb-1">
              Habilidades técnicas del cargo (nota de 1 a 5) <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-outline mb-1.5">Calidad técnica y resolución de problemas en el trabajo diario.</p>
            <input id="eval-tech" type="text" inputMode="decimal" autoFocus value={technical} onChange={(e) => setTechnical(e.target.value)} placeholder="Ej: 4,5" aria-invalid={submitted && !!errors.technical} className={`${inputClass} ${borderFor(errors.technical)}`} />
            <FieldError text={errors.technical} />
          </div>

          <div>
            <label htmlFor="eval-team" className="font-bold text-on-surface block mb-1">
              Trabajo en equipo y comunicación (nota de 1 a 5) <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-outline mb-1.5">Colaboración con compañeros, actitud y claridad al comunicarse.</p>
            <input id="eval-team" type="text" inputMode="decimal" value={teamwork} onChange={(e) => setTeamwork(e.target.value)} placeholder="Ej: 4,0" aria-invalid={submitted && !!errors.teamwork} className={`${inputClass} ${borderFor(errors.teamwork)}`} />
            <FieldError text={errors.teamwork} />
          </div>

          <div>
            <label htmlFor="eval-comments" className="font-bold text-on-surface block mb-1">
              Comentarios para el colaborador <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-outline mb-1.5">Fortalezas observadas y oportunidades para su plan de crecimiento.</p>
            <textarea id="eval-comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Ej: Cumplió los objetivos del trimestre y ayudó a sus compañeros..." aria-invalid={submitted && !!errors.comments} className={`${inputClass} ${borderFor(errors.comments)} resize-none font-normal`} />
            <FieldError text={errors.comments} />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/20">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container cursor-pointer transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container shadow-xs cursor-pointer flex items-center gap-1.5 transition-all">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
              Guardar evaluación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
