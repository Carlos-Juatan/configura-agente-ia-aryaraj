import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from './constants/auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ConfigPanel from './components/ConfigPanel';
import FAQ from './components/FAQ';
import KnowledgeBaseList from './components/KnowledgeBaseList';
import KnowledgeBaseEditor from './components/KnowledgeBaseEditor';
import ToolsManager from './components/ToolsManager';
import ChatPlayground from './components/ChatPlayground';
import Financeiro from './components/Financeiro';
import FineTuning from './components/FineTuning';
import IntegrationsPanel from './components/IntegrationsPanel';
import PublicChat from './components/PublicChat';
import SharedHistory from './components/SharedHistory';
import Login from './components/Login';
import Register from './components/Register';
import UserManagement from './components/UserManagement';
import SupportDashboard from './components/SupportDashboard';
import UnansweredQuestions from './components/UnansweredQuestions';
import PublicSupportView from './components/PublicSupportView';
import PublicQuestionsView from './components/PublicQuestionsView';
import BackgroundTasks from './components/BackgroundTasks';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
  };

  const userRole = localStorage.getItem('user_role');
  const isSuperAdmin = userRole === USER_ROLES.SUPERADMIN;
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isUsuarioAdmin = userRole === USER_ROLES.USUARIO_ADMIN;
  const isUser = userRole === USER_ROLES.USUARIO;

  const isTeam = isSuperAdmin || isAdmin;
  const isManagement = isTeam || isUsuarioAdmin;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chat/:agentId" element={<PublicChat />} />
        <Route path="/shared/:sessionId" element={<SharedHistory />} />
        <Route path="/public/support/:token" element={<PublicSupportView />} />
        <Route path="/public/questions/:token" element={<PublicQuestionsView />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLogin={() => setIsAuthenticated(true)} />
        } />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={
          !isAuthenticated ? <Navigate to="/login" /> : (
            <div className="app-layout">
              <Sidebar onLogout={handleLogout} />
              <main className="main-content">
                <div className="content-container">
                  <Routes>
                    {/* Rotas Comuns */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/playground" element={<ChatPlayground />} />
                    <Route path="/inbox" element={<UnansweredQuestions />} />

                    {/* Rotas restritas para o TIME (Admin e Super Admin) */}
                    {isTeam && (
                      <>
                        <Route path="/agent/new" element={<ConfigPanel />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/tools" element={<ToolsManager standalone={true} />} />
                        <Route path="/fine-tuning" element={<FineTuning />} />
                        <Route path="/integrations" element={<IntegrationsPanel />} />
                        <Route path="/background-tasks" element={<BackgroundTasks />} />
                        <Route path="/support" element={<SupportDashboard />} />
                      </>
                    )}

                    {/* Rota restrita para GESTÃO (Super Admin, Admin e Client Admin) */}
                    {isManagement && (
                      <>
                        <Route path="/financeiro" element={<Financeiro />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/agent/:id" element={<ConfigPanel />} />
                        <Route path="/knowledge-bases" element={<KnowledgeBaseList />} />
                        <Route path="/knowledge-bases/:id" element={<KnowledgeBaseEditor />} />
                      </>
                    )}

                    {/* Redirecionar qualquer acesso não autorizado para a Home */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </div>
              </main>
            </div>
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
