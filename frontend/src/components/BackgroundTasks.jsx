import React, { useState, useEffect, useRef } from 'react';
import { API_URL, AGENT_API_KEY } from '../config';
import TaskDetailsModal from './TaskDetailsModal';

const BackgroundTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('Todos'); // 'Todos', 'Em Processo', 'Finalizados', 'Erros'
    const [selectedTask, setSelectedTask] = useState(null);
    const wsRef = useRef(null);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_URL}/background-tasks/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'X-API-Key': AGENT_API_KEY
                }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTasks();

        // WS Connection
        const wsUrl = API_URL.replace('http', 'ws') + '/background-tasks/ws';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const activeTasksUpdate = JSON.parse(event.data);
            // Mescla updates em state "tasks"
            if (activeTasksUpdate.length > 0) {
                setTasks(prev => {
                    const newTasks = [...prev];
                    activeTasksUpdate.forEach(updated => {
                        const idx = newTasks.findIndex(t => t.id === updated.id);
                        if (idx !== -1) {
                            newTasks[idx].status = updated.status;
                            newTasks[idx].progress = updated.progress;
                        } else {
                            // Poderia fazer refetch geral caso uma task nova surja
                            fetchTasks(); 
                        }
                    });
                    return newTasks;
                });
            }
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const handleDelete = async (task, e) => {
        e.stopPropagation();
        if (task.status === 'PENDENTE' || task.status === 'PROCESSANDO') {
            if (!window.confirm("Esta tarefa está em andamento. Deseja cancelar o processamento?")) return;
            
            try {
                await fetch(`${API_URL}/background-tasks/${task.id}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                        'X-API-Key': AGENT_API_KEY
                    }
                });
                fetchTasks(); // Reload
            } catch (err) { console.error(err); }
        } else {
            if (!window.confirm("Apagar o log permanentemente?")) return;
            try {
                await fetch(`${API_URL}/background-tasks/${task.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                        'X-API-Key': AGENT_API_KEY
                    }
                });
                fetchTasks(); // Reload
            } catch (err) { console.error(err); }
        }
    };

    const getFilteredTasks = () => {
        if (activeTab === 'Todos') return tasks;
        if (activeTab === 'Em Processo') return tasks.filter(t => t.status === 'PENDENTE' || t.status === 'PROCESSANDO');
        if (activeTab === 'Finalizados') return tasks.filter(t => t.status === 'CONCLUIDO');
        if (activeTab === 'Erros') return tasks.filter(t => t.status === 'ERRO');
        return tasks;
    };

    const getStatusTagColor = (status) => {
        switch(status){
            case 'PENDENTE': return '#f59e0b'; // amber
            case 'PROCESSANDO': return '#3b82f6'; // blue
            case 'CONCLUIDO': return '#10b981'; // green
            case 'ERRO': return '#ef4444'; // red
            default: return 'var(--text-muted)';
        }
    };

    const getStatusText = (status) => {
        if (status === 'PENDENTE') return '⏳ Na Fila';
        if (status === 'PROCESSANDO') return '🔄 Processando';
        if (status === 'CONCLUIDO') return '✅ Finalizado';
        if (status === 'ERRO') return '❌ Erro';
        return status;
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h2>🕛 Processamentos em Background</h2>
                <p>Monitore suas filas, status de tarefas longas e visualize relatórios de logs passados.</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginTop: '20px' }}>
                 {['Todos', 'Em Processo', 'Finalizados', 'Erros'].map(tab => (
                     <div 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px', 
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-color)',
                            borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : 'none'
                        }}
                     >
                        {tab}
                     </div>
                 ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {getFilteredTasks().length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Nenhuma tarefa encontrada nesta sessão.</div>
                )}
                
                {getFilteredTasks().map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-lighter)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        
                        <div style={{ flex: '1' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{task.process_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                ID: #{task.id} • {new Date(task.created_at).toLocaleString()}
                            </div>
                        </div>

                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ 
                                background: 'var(--bg-dark)', 
                                color: getStatusTagColor(task.status), 
                                padding: '4px 12px', 
                                borderRadius: '16px', 
                                fontSize: '12px', 
                                fontWeight: 'bold',
                                border: `1px solid ${getStatusTagColor(task.status)}40`
                            }}>
                                {getStatusText(task.status)}
                            </div>
                            
                            {(task.status === 'PENDENTE' || task.status === 'PROCESSANDO') && (
                                <div style={{ width: '80%', background: 'var(--bg-dark)', height: '8px', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${task.progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.3s ease' }}></div>
                                </div>
                            )}
                            {(task.status === 'PENDENTE' || task.status === 'PROCESSANDO') && (
                                <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>{task.progress}%</div>
                            )}
                        </div>

                        <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                className="action-btn-outline" 
                                style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--bg-dark)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => setSelectedTask(task)}
                            >
                                Ver detalhes
                            </button>
                            <button 
                                onClick={(e) => handleDelete(task, e)}
                                title={task.status === 'PENDENTE' || task.status === 'PROCESSANDO' ? "Cancelar Processamento" : "Apagar log"}
                                style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef444440', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                🗑️
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            {selectedTask && (
                <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
};

export default BackgroundTasks;
