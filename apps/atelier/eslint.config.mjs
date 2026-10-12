import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
// The retained design reference predates compiler effect recommendations.
export default [...nextVitals,...nextTypescript,{rules:{'react-hooks/set-state-in-effect':'off','react-hooks/refs':'off'}}];
