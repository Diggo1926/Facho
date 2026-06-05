import Phase1Ideia from './phases/Phase1Ideia.jsx';
import Phase2Arquitetura from './phases/Phase2Arquitetura.jsx';
import Phase3Design from './phases/Phase3Design.jsx';
import Phase4Seguranca from './phases/Phase4Seguranca.jsx';
import Phase5Desenvolvimento from './phases/Phase5Desenvolvimento.jsx';
import Phase6Testes from './phases/Phase6Testes.jsx';
import Phase7Deploy from './phases/Phase7Deploy.jsx';
import Phase8Entrega from './phases/Phase8Entrega.jsx';

const PHASE_COMPONENTS = [
  Phase1Ideia,
  Phase2Arquitetura,
  Phase3Design,
  Phase4Seguranca,
  Phase5Desenvolvimento,
  Phase6Testes,
  Phase7Deploy,
  Phase8Entrega,
];

export default function PhaseView({ project, phase, onPhaseUpdated, onConclude }) {
  if (!phase) return null;

  const Component = PHASE_COMPONENTS[phase.numero - 1];
  if (!Component) return null;

  return (
    <Component
      project={project}
      phase={phase}
      onPhaseUpdated={onPhaseUpdated}
      onConclude={onConclude}
    />
  );
}
