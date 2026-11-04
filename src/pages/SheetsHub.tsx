import Cast from './Cast';

/**
 * Compatibilidade: a antiga rota /fichas agora abre o Elenco, que é a fonte
 * única para fichas completas, personagens, monstros, compartilhamento e mesa.
 */
const SheetsHub = () => <Cast />;

export default SheetsHub;
