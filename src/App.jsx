import React, { useState, useRef, useEffect } from 'react';

const COLORS = {
  bg: '#FAF7F5',
  terracotta: '#C08D7C',
  sage: '#8C9C84',
  border: '#D6C8C0',
  text: '#7A6B63',
  inputBg: '#FFFFFF',
  error: '#D98E82'
};

const FONT_SERIF = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

const RECIPES_DATA = {
  cheesecake: {
    title: "Cheesecake de Frutas Vermelhas",
    desc: "Uma sobremesa clássica, com base crocante de biscoito, recheio cremoso à base de cream cheese e uma calda azedinha artesanal.",
    prep: "1. Triture os biscoitos e misture com manteiga derretida para forrar a forma.\n2. Bata o cream cheese com açúcar, ovos e raspas de limão.\n3. Despeje na forma e asse em banho-maria por 50 minutos.\n4. Deixe esfriar e cubra com a calda de morangos e amoras antes de gelar por 4 horas."
  },
  cenoura: {
    title: "Bolo de Cenoura Fofinho",
    desc: "O queridinho dos cafés da tarde. Massa aerada feita no liquidificador com uma cobertura de chocolate que craquela ao esfriar.",
    prep: "1. Bata no liquidificador as cenouras picadas, ovos e óleo.\n2. Transfira para uma tigela e misture o açúcar e a farinha de trigo peneirada.\n3. Adicione o fermento e asse por 40 minutos a 180°C.\n4. Faça a calda com chocolate em pó, açúcar, leite e manteiga até ferver, e jogue por cima."
  },
  omelete: {
    title: "Omelete Nutritivo de Legumes",
    desc: "Uma opção rápida, leve e rica em proteínas para o seu almoço ou jantar, recheada com tomates, espinafre fresco e cubos de queijo branco."
  }
};

function App() {
  // --- RESPONSIVIDADE CONTROLADA PURAMENTE PELO REACT ---
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ESTADOS DE NAVEGAÇÃO E ENTRADAS ---
  const [currentPage, setCurrentPage] = useState('camuflagem');
  const [authMode, setAuthMode] = useState('signup');
  const [selectedRecipeKey, setSelectedRecipeKey] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [arquivosReais, setArquivosReais] = useState([]);

  const [regNome, setRegNome] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); 
  const BACKEND_URL = "https://aegis-backendd.up.railway.app";

  const triggerNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const verificarSeExisteCadastro = () => {
    return localStorage.getItem('salvia_user_password') !== null;
  };

  const handleAcessarReceitaSelecionada = () => {
    if (!selectedRecipeKey) {
      triggerNotification("Selecione uma opção da lista para prosseguir.", "error");
      return;
    }
    if (selectedRecipeKey === 'omelete') {
      if (verificarSeExisteCadastro()) {
        setAuthMode('login');
      } else {
        setAuthMode('signup');
      }
      setCurrentPage('auth');
    } else {
      setActiveRecipe(selectedRecipeKey);
    }
  };

  const handleCadastro = (e) => {
    e.preventDefault();
    if (!regNome || !regCpf || !regSenha) {
      triggerNotification("Por favor, preencha todos os campos.", "error");
      return;
    }
    localStorage.setItem('salvia_user_name', regNome);
    localStorage.setItem('salvia_user_cpf', regCpf);
    localStorage.setItem('salvia_user_password', regSenha);
    triggerNotification("Perfil configurado com sucesso!", "success");
    setCurrentPage('vault');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginSenha === localStorage.getItem('salvia_user_password')) {
      triggerNotification("Chave validada. Bem-vinda de volta!", "success");
      setCurrentPage('vault');
      setLoginSenha('');
    } else {
      triggerNotification("Chave de acesso incorreta.", "error");
    }
  };

  const carregarArquivosDoCofre = async () => {
    try {
      const cpfSalvo = localStorage.getItem('salvia_user_cpf') || 'anonimo';
      const response = await fetch(`${BACKEND_URL}/listar-documentos?cpf=${cpfSalvo}`);
      if (response.ok) {
        const dados = await response.json();
        setArquivosReais(dados.arquivos || []);
      }
    } catch (error) {
      console.error("Erro ao conectar com a Magalu Cloud:", error);
    }
  };

  useEffect(() => {
    if (currentPage === 'vault') {
      carregarArquivosDoCofre();
    }
  }, [currentPage]);

  const universalUpload = async (fileData, originalName, mimeType) => {
    setCarregando(true);
    setProgresso(10);
    try {
      const response = await fetch(`${BACKEND_URL}/upload-seguro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: fileData,
          filename: originalName,
          mime_type: mimeType,
          cpf: localStorage.getItem('salvia_user_cpf') || 'anonimo'
        })
      });
      setProgresso(100);
      if (response.ok) {
        setTimeout(() => {
          triggerNotification("Documento salvo na Magalu Cloud!", "success");
          setShowUploadModal(false);
          setProgresso(0);
          carregarArquivosDoCofre();
        }, 500);
      }
    } catch (error) {
      triggerNotification("Falha de conexão com o servidor.", "error");
    } finally {
      setCarregando(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => universalUpload(reader.result, file.name, file.type);
      reader.readAsDataURL(file);
    }
  };

  // --- CORREÇÃO DO BUG DA CÂMERA ESCURA EM PWA ---
  useEffect(() => {
    if (viewMode === 'camera' && showUploadModal) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Força a execução contínua no ecossistema mobile/PWA
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => console.log("Autoplay bloqueado, tentando novamente:", error));
          }
        }
      })
      .catch(err => {
        triggerNotification("Permissão de câmera negada ou não suportada.", "error");
        setViewMode('list');
      });
    }

    // Desliga a câmera imediatamente quando fechar o modal ou mudar de aba
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewMode, showUploadModal]);

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const b64 = canvas.toDataURL('image/jpeg');
      universalUpload(b64, `camera_${Date.now()}.jpg`, 'image/jpeg');
    }
  };

  const baixarDocumentoReal = async (key) => {
    try {
      const response = await fetch(`${BACKEND_URL}/baixar-documento/${key}`);
      if (response.ok) {
        const dados = await response.json();
        const link = document.createElement('a');
        link.href = dados.download_url;
        link.setAttribute('download', key);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerNotification("Download iniciado com segurança!", "success");
      }
    } catch (error) {
      triggerNotification("Erro ao processar o download.", "error");
    }
  };

  // --- OBJETOS DE ESTILOS CONTROLADOS POR ESTADOS DO REACT ---
  const wrapperStyle = {
    backgroundColor: '#EFEAE6',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    padding: isDesktop ? '30px' : '0',
    boxSizing: 'border-box'
  };

  const containerStyle = {
    backgroundColor: COLORS.bg,
    width: '100%',
    maxWidth: isDesktop ? '1150px' : '100%',
    height: isDesktop ? '85vh' : '100vh',
    maxHeight: isDesktop ? '800px' : '100vh',
    borderRadius: isDesktop ? '24px' : '0',
    padding: isDesktop ? '40px' : '20px',
    boxShadow: isDesktop ? '0px 15px 45px rgba(0, 0, 0, 0.06)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflowY: 'auto',
    boxSizing: 'border-box',
    fontFamily: FONT_SANS
  };

  const toastStyle = {
    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: toast.type === 'success' ? COLORS.sage : COLORS.error,
    color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 1000, fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '85%', maxWidth: '380px',
    transition: 'all 0.3s ease-in-out', opacity: toast.show ? 1 : 0, visibility: toast.show ? 'visible' : 'hidden'
  };

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>

        {/* TOAST NOTIFICATION REAL */}
        <div style={toastStyle}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '} {toast.message}
        </div>

        {/* ================= TELA 1: CAMUFLAGEM (DROPDOWN REAL) ================= */}
        {currentPage === 'camuflagem' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            {!activeRecipe ? (
              <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <h2 style={{ color: COLORS.terracotta, marginBottom: '10px', fontWeight: '400', fontSize: '32px', fontFamily: FONT_SERIF }}>
                  Minhas Receitas Diárias
                </h2>
                <p style={{ color: COLORS.text, fontSize: '15px', marginBottom: '30px' }}>Selecione abaixo uma receita do seu caderno digital para conferir os detalhes.</p>

                {/* SELECT DROPDOWN */}
                <select
                  style={dropdownSelectStyle}
                  value={selectedRecipeKey}
                  onChange={(e) => setSelectedRecipeKey(e.target.value)}
                >
                  <option value="">Escolha uma opção culinária...</option>
                  <option value="cheesecake">Cheesecake de Frutas Vermelhas</option>
                  <option value="cenoura">Bolo de Cenoura Fofinho</option>
                  <option value="omelete">Omelete Nutritivo de Legumes</option>
                </select>

                <button onClick={handleAcessarReceitaSelecionada} style={submitBtnStyle}>
                  Acessar Conteúdo da Receita
                </button>
              </div>
            ) : (
              // TELA DE DESCRIÇÃO DA RECEITA
              <div style={{ textAlign: 'left', maxWidth: '750px', width: '100%' }}>
                <button onClick={() => { setActiveRecipe(null); setSelectedRecipeKey(''); }} style={{ ...verReceitaBtn, marginBottom: '25px', width: 'auto' }}>← Voltar para a Seleção</button>
                <h2 style={{ color: COLORS.terracotta, margin: '0 0 10px 0', fontSize: '28px', fontFamily: FONT_SERIF }}>{RECIPES_DATA[activeRecipe].title}</h2>
                <p style={{ color: COLORS.text, fontSize: '15px', lineHeight: '1.5', marginBottom: '20px' }}>{RECIPES_DATA[activeRecipe].desc}</p>

                <h4 style={{ color: COLORS.text, margin: '20px 0 10px 0', fontSize: '16px', fontWeight: '600' }}>Modo de Preparo Avançado:</h4>
                <p style={{ color: COLORS.text, whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.7', backgroundColor: '#FFF', padding: '25px', borderRadius: '14px', border: `1px solid ${COLORS.border}` }}>
                  {RECIPES_DATA[activeRecipe].prep}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TELA 2: LOGIN / CADASTRO ================= */}
        {currentPage === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div style={{ width: '100%', maxWidth: '420px', textAlign: 'left' }}>
              <button onClick={() => { setCurrentPage('camuflagem'); setSelectedRecipeKey(''); }} style={{ ...verReceitaBtn, marginBottom: '20px', width: 'auto' }}>← Voltar ao Início</button>

              {authMode === 'signup' ? (
                <form onSubmit={handleCadastro} style={formStyle}>
                  <h3 style={{ color: COLORS.terracotta, margin: '0 0 10px 0', fontSize: '22px', fontFamily: FONT_SERIF }}>Criar Perfil de Acesso</h3>
                  <p style={{ color: COLORS.text, fontSize: '13px', marginBottom: '20px' }}>Registre os dados para sincronizar suas anotações culinárias salvas.</p>

                  <label style={labelStyle}>Nome Completo</label>
                  <input type="text" value={regNome} onChange={(e) => setRegNome(e.target.value)} style={inputStyle} placeholder="Nome de identificação" required />

                  <label style={labelStyle}>CPF de Registro</label>
                  <input type="text" value={regCpf} onChange={(e) => setRegCpf(e.target.value)} style={inputStyle} placeholder="Apenas números" required />

                  <label style={labelStyle}>Senha Digital</label>
                  <input type="password" value={regSenha} onChange={(e) => setRegSenha(e.target.value)} style={inputStyle} placeholder="Digite sua senha numérica" required />

                  <button type="submit" style={submitBtnStyle}>Configurar e Avançar</button>
                </form>
              ) : (
                <form onSubmit={handleLogin} style={formStyle}>
                  <h3 style={{ color: COLORS.terracotta, margin: '0 0 10px 0', fontSize: '22px', fontFamily: FONT_SERIF }}>Desbloquear Receita Restrita</h3>
                  <p style={{ color: COLORS.text, fontSize: '13px', marginBottom: '20px' }}>Insira sua chave cadastrada para visualizar as proporções de legumes.</p>

                  <label style={labelStyle}>Senha de Acesso</label>
                  <input type="password" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} style={inputStyle} placeholder="Digite sua senha numérica" required />

                  <button type="submit" style={submitBtnStyle}>Validar Credencial</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ================= TELA 3: COFRE DIGITAL REAL RESPONSIVO EM REACT ================= */}
        {currentPage === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.text }}>Ambiente Soberano de Proteção</p>
                <h2 style={{ margin: 0, color: COLORS.terracotta, fontSize: '28px', fontWeight: '400', fontFamily: FONT_SERIF }}>Cofre AEGIS</h2>
              </div>
              <button onClick={() => { setCurrentPage('camuflagem'); setSelectedRecipeKey(''); }} style={sairBtn}>FECHAR SESSÃO</button>
            </div>

            <div style={{ position: 'relative', marginBottom: '25px' }}>
              <input type="text" placeholder="Buscar arquivos confidenciais por nome..." style={searchStyle} />
              <span style={{ position: 'absolute', right: '20px', top: '14px', color: COLORS.terracotta, fontSize: '18px' }}>🔍</span>
            </div>

            <div style={storageBarStyle}>
              <div style={{ ...storageFillStyle, width: `${Math.min(arquivosReais.length * 8, 100)}%`, backgroundColor: COLORS.sage }}></div>
            </div>
            <p style={{ fontSize: '12px', textAlign: 'right', color: COLORS.text, marginTop: '6px', fontWeight: '500' }}>
              Sincronizado: {arquivosReais.length} arquivo(s) ativos na Magalu Cloud
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div style={cardStyle}><span style={{ fontSize: '22px' }}>📁</span><p style={cardTitleStyle}>Documentos Ativos</p><span style={cardCountStyle}>{arquivosReais.length} itens</span></div>
              <div style={cardStyle}><span style={{ fontSize: '22px' }}>🛡️</span><p style={cardTitleStyle}>Sessão Criptografada</p><span style={{ ...cardCountStyle, color: COLORS.terracotta, fontWeight: '700' }}>{localStorage.getItem('salvia_user_cpf')}</span></div>
            </div>

            {/* Layout Condicional React (Flex Row no PC, Coluna Única no Celular) */}
            <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '40px', marginTop: '30px', alignItems: 'flex-start' }}>

              {/* Painel Esquerdo: Lista de Arquivos */}
              <div style={{ flex: 1, width: '100%' }}>
                <h4 style={{ color: COLORS.terracotta, fontSize: '20px', textAlign: 'left', margin: '0 0 15px 0', fontFamily: FONT_SERIF }}>Repositório de Evidências Blindadas</h4>
                <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                  {arquivosReais.length === 0 ? (
                    <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'left', fontStyle: 'italic', marginTop: '15px' }}>Nenhum arquivo armazenado na nuvem.</p>
                  ) : (
                    arquivosReais.map((arq) => (
                      <div key={arq.key} style={fileItemStyle}>
                        <div style={{ textAlign: 'left', maxWidth: '75%' }}>
                          <p style={{ margin: 0, fontWeight: '600', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📄 {arq.key.split('/').pop().length > 37 ? arq.key.split('/').pop().substring(37) : arq.key.split('/').pop()}
                          </p>
                          <span style={{ fontSize: '11px', color: '#aaa' }}>{(arq.tamanho / 1024).toFixed(1)} KB</span>
                        </div>
                        <button onClick={() => baixarDocumentoReal(arq.key)} style={baixarBtnStyle}>Baixar</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Painel Direito: Ações (SÓ EXIBE NO DESKTOP VIA CONFIGURAÇÃO REACT) */}
              {isDesktop && (
                <div style={rightPanelDesktopStyle}>
                  <h4 style={{ color: COLORS.terracotta, margin: '0 0 10px 0', fontSize: '18px', fontFamily: FONT_SERIF }}>Painel do Operador</h4>
                  <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: '1.5', marginBottom: '20px' }}>Envie fotos instantâneas ou PDFs com segurança soberana na nuvem.</p>
                  <button onClick={() => setShowUploadModal(true)} style={{ ...submitBtnStyle, marginTop: 0 }}>+ Enviar Nova Mídia</button>
                </div>
              )}
            </div>

            {/* No celular exibe o Botão Flutuante (FAB) */}
            {!isDesktop && <button onClick={() => setShowUploadModal(true)} style={fabStyle}>+</button>}

            {/* MODAL DE ENVIOS (CÂMERA CORRIGIDA) */}
            {showUploadModal && (
              <div style={modalOverlay}>
                <div style={modalContent}>
                  <div style={modalDashStyle}>
                    {viewMode === 'list' ? (
                      <label style={uploadAreaStyle}>
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        <div style={{ fontSize: '45px', marginBottom: '10px' }}>📁</div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '500' }}>Carregar arquivo local ou ativar captura</p>
                        <button onClick={(e) => { e.preventDefault(); setViewMode('camera'); }} style={cameraToggleBtn}>Disparar Câmera Silenciosa</button>
                      </label>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        {/* Correção estrutural do elemento de captura de mídia */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', borderRadius: '12px', backgroundColor: '#000', display: 'block' }}
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <button onClick={capturarFoto} style={actionBtn}>Bater Foto do Documento</button>
                        <button onClick={() => setViewMode('list')} style={{ ...actionBtn, backgroundColor: '#ccc', color: '#333' }}>Cancelar Câmera</button>
                      </div>
                    )}

                    {progresso > 0 && (
                      <div style={{ width: '100%', marginTop: '20px' }}>
                        <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progresso}%`, backgroundColor: COLORS.sage, transition: '0.3s' }}></div>
                        </div>
                        <p style={{ fontSize: '12px', color: COLORS.sage, margin: '6px 0 0 0', fontWeight: '600' }}>Sincronizando com Magalu Cloud... {progresso}%</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setShowUploadModal(false)} style={cancelBtn}>Fechar Módulo</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos Core Estruturais Objetificados
const dropdownSelectStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, backgroundColor: 'white', color: COLORS.text, fontSize: '15px', outline: 'none', cursor: 'pointer', marginBottom: '20px', boxSizing: 'border-box' };
const rightPanelDesktopStyle = { width: '380px', backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' };
const verReceitaBtn = { width: '100%', padding: '12px 18px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const sairBtn = { border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '8px', padding: '8px 16px', color: COLORS.terracotta, fontWeight: '700', fontSize: '12px', backgroundColor: 'transparent', cursor: 'pointer' };
const searchStyle = { width: '100%', padding: '14px 45px 14px 20px', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, backgroundColor: COLORS.inputBg, color: COLORS.text, fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const storageBarStyle = { height: '8px', backgroundColor: '#EFEAE6', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' };
const storageFillStyle = { height: '100%', transition: '0.5s' };
const cardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '18px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' };
const cardTitleStyle = { margin: 0, fontSize: '14px', fontWeight: '500', color: COLORS.text };
const cardCountStyle = { fontSize: '12px', color: '#aaa' };
const fileItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${COLORS.border}` };
const baixarBtnStyle = { backgroundColor: 'transparent', border: `1px solid ${COLORS.sage}`, color: COLORS.sage, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const fabStyle = { position: 'absolute', bottom: '25px', right: '25px', width: '56px', height: '56px', borderRadius: '28px', backgroundColor: COLORS.terracotta, color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(192,141,124,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 };
const modalContent = { backgroundColor: COLORS.bg, padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '440px' };
const modalDashStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: `1px solid ${COLORS.border}` };
const uploadAreaStyle = { border: `1.5px dashed ${COLORS.terracotta}`, borderRadius: '12px', padding: '35px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: COLORS.terracotta, cursor: 'pointer' };
const cameraToggleBtn = { marginTop: '8px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' };
const actionBtn = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer', fontSize: '14px', fontWeight: '500' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'white', padding: '30px', borderRadius: '18px', border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '-4px' };
const inputStyle = { padding: '11px 14px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '14px', color: COLORS.text, backgroundColor: COLORS.inputBg };
const submitBtnStyle = { padding: '14px', backgroundColor: COLORS.terracotta, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', width: '100%', boxSizing: 'border-box' };

export default App;