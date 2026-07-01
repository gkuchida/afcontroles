import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react' //  Certo

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