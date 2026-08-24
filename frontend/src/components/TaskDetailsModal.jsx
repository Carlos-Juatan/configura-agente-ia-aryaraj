import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { API_URL, AGENT_API_KEY } from '../config';

const TaskDetailsModal = ({ task, onClose }) => {
    const [logEntries, setLogEntries] = useState([]);
    const [status, setStatus] = useState(task?.status || "PENDENTE");
    const [retryCount, setRetryCount] = useState(task?.retry_count || 0);
    const [language, setLanguage] = useState(task?.language || "auto");
    const [isReprocessing, setIsReprocessing] = useState(false);
    
    const terminalEndRef = useRef(null);
    const wsRef = useRef(null);

    // Auto-scroll the terminal when new logs arrive
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logEntries]);

    // Connect WebSocket
    useEffect(() => {
        if (!task || !task.id) return;
        
        // Function to create and handle WS connection
        const connectWs = () => {
            const wsUrl = API_URL.replace('http', 'ws') + `/background-tasks/ws/tasks/${task.id}/logs`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.status) setStatus(data.status);
                    if (data.retry_count !== undefined) setRetryCount(data.retry_count);
                    if (data.language) setLanguage(data.language);

                    if (data.new_entries && data.new_entries.length > 0) {
                        setLogEntries(prev => [...prev, ...data.new_entries]);
                    }

                    if (data.done) {
                        ws.close();
                    }
                } catch (e) {
                    console.error("Erro ao fazer parse da mensagem WS", e);
                }
            };

            ws.onclose = () => {
                // Se a task foi reprocessada (status volta para PENDENTE),
                // podemos querer reconectar, mas no nosso caso o botão reprocessar 
                // zera o estado local e cria uma nova conexão.
            };
        };

        connectWs();

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [task]); // Se task.id mudar, reconecta

    const handleReprocess = async () => {
        if (!task || !task.id) return;
        setIsReprocessing(true);

        try {
            const res = await fetch(`${API_URL}/background-tasks/${task.id}/reprocess`, {
                method: 'POST',
                headers: {
                    'x-api-key': AGENT_API_KEY
                }
            });

            if (res.ok) {
                // Reseta estado local para acompanhar o novo processamento
                setLogEntries([]);
                setStatus("PENDENTE");
                setRetryCount(0);
                
                // Reconecta o WS
                if (wsRef.current) wsRef.current.close();
                const wsUrl = API_URL.replace('http', 'ws') + `/background-tasks/ws/tasks/${task.id}/logs`;
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status) setStatus(data.status);
                    if (data.retry_count !== undefined) setRetryCount(data.retry_count);
                    if (data.language) setLanguage(data.language);
                    if (data.new_entries && data.new_entries.length > 0) {
                        setLogEntries(prev => [...prev, ...data.new_entries]);
                    }
                    if (data.done) ws.close();
                };
            } else {
                const err = await res.json();
                alert(`Erro ao reprocessar: ${err.detail || 'Falha desconhecida'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão ao tentar reprocessar a tarefa.");
        } finally {
            setIsReprocessing(false);
        }
    };

    if (!task) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 10, 20, 0.95)',
            backdropFilter: 'blur(15px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="fade-in" style={{
                background: '#0f172a',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '900px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '2rem' }}>⚙️</div>
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Detalhes da Tarefa #{task.id}</h2>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.85rem' }}>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    background: status === 'ERRO' ? 'rgba(239,68,68,0.1)' : status === 'CONCLUIDO' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                    color: status === 'ERRO' ? '#ef4444' : status === 'CONCLUIDO' ? '#10b981' : '#3b82f6',
                                    fontWeight: 'bold',
                                    border: `1px solid ${status === 'ERRO' ? 'rgba(239,68,68,0.2)' : status === 'CONCLUIDO' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`
                                }}>
                                    {status}
                                </span>
                                {retryCount > 0 && (
                                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 'bold', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        Retentativas: {retryCount}/3
                                    </span>
                                )}
                                {language && (
                                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 'bold', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        Idioma: {language.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8', width: '40px', height: '40px', borderRadius: '12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Terminal Area */}
                <div style={{
                    flex: 1,
                    background: '#020617',
                    padding: '20px',
                    overflowY: 'auto',
                    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    position: 'relative'
                }}>
                    {logEntries.length === 0 ? (
                        <div style={{ color: '#475569', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px' }}>
                            <div className="spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%' }}></div>
                            Aguardando logs...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {logEntries.map((log, idx) => {
                                let color = '#e2e8f0';
                                if (log.level === 'ERROR') color = '#ef4444';
                                else if (log.level === 'WARNING') color = '#f59e0b';
                                else if (log.message.includes('✅') || log.message.includes('🎉')) color = '#10b981';

                                const timeStr = new Date(log.timestamp).toLocaleTimeString();

                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '15px', color }}>
                                        <span style={{ color: '#475569', userSelect: 'none', minWidth: '75px' }}>[{timeStr}]</span>
                                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{log.message}</span>
                                    </div>
                                );
                            })}
                            <div ref={terminalEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {status === 'PROCESSANDO' || status === 'PENDENTE' ? '⏳ Processo em andamento...' : '🏁 Processo finalizado.'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {status === 'ERRO' && (
                            <button
                                onClick={handleReprocess}
                                disabled={isReprocessing}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.2s',
                                    opacity: isReprocessing ? 0.7 : 1
                                }}
                            >
                                {isReprocessing ? (
                                    <>
                                        <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}></div>
                                        Reiniciando...
                                    </>
                                ) : (
                                    <>🔄 Reprocessar Tarefa</>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            Fechar Painel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TaskDetailsModal;
