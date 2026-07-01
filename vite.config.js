import { defineConfig, loadEnv } from 'vite';
import react from '@pluginjs/vite-plugin-react'; // Ou o seu plugin padrão do react

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (development ou production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    }
  };
});