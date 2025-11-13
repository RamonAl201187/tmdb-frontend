// Detectar ambiente automáticamente
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : ''https://tmdb-backend-sdqh.onrender.com';

// Estado global
let genreData = null;
let directorData = null;
let genreChart = null;
let directorChart = null;
let currentChartType = 'bar';
let currentSortOrder = 'desc';

// Configuración de Chart.js
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

// --- Actualizar valores de los sliders ---
document.getElementById('genreLimit')?.addEventListener('input', (e) => {
    document.getElementById('genreLimitValue').textContent = e.target.value;
});

document.getElementById('directorLimit')?.addEventListener('input', (e) => {
    document.getElementById('directorLimitValue').textContent = e.target.value;
});

// --- Función para crear gráficos ---
function createChart(canvasId, type, title, labels, data, isRevenue = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior si existe
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Gradiente para las barras
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)');
    
    const config = {
        type: type === 'horizontalBar' ? 'bar' : type,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: type === 'pie' ? [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                ] : gradient,
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: type === 'bar' ? 8 : 0,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: type === 'horizontalBar' ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: type === 'pie'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (isRevenue) {
                                label += '$' + context.parsed.y.toFixed(1) + 'M';
                            } else {
                                label += context.parsed.y + ' películas';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: type !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            if (isRevenue) {
                                return '$' + value + 'M';
                            }
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            } : {},
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    return new Chart(ctx, config);
}

// --- Aplicar filtros ---
function applyGenreFilter() {
    const limit = parseInt(document.getElementById('genreLimit').value);
    if (genreData) {
        const filteredData = sortData(genreData.slice(0, limit), currentSortOrder);
        updateGenreChart(filteredData);
        document.getElementById('genreChartTitle').textContent = `Top ${limit} Géneros Más Populares`;
    }
}

function applyDirectorFilter() {
    const limit = parseInt(document.getElementById('directorLimit').value);
    if (directorData) {
        const filteredData = sortData(directorData.slice(0, limit), currentSortOrder);
        updateDirectorChart(filteredData);
        document.getElementById('directorChartTitle').textContent = `Top ${limit} Directores por Ingresos`;
    }
}

function applySortOrder() {
    currentSortOrder = document.getElementById('sortOrder').value;
    applyGenreFilter();
    applyDirectorFilter();
}

function changeChartType() {
    currentChartType = document.getElementById('chartType').value;
    applyGenreFilter();
    applyDirectorFilter();
}

// --- Ordenar datos ---
function sortData(data, order) {
    const sorted = [...data];
    if (order === 'asc') {
        return sorted.sort((a, b) => {
            const valA = a.conteo || a.ingresos_totales;
            const valB = b.conteo || b.ingresos_totales;
            return valA - valB;
        });
    }
    return sorted;
}

// --- Actualizar gráficos ---
function updateGenreChart(data) {
    const labels = data.map(item => item.nombre);
    const counts = data.map(item => item.conteo);
    
    genreChart = createChart('genreChart', currentChartType, 'Número de Películas', labels, counts, false);
    updateTable('genres', data);
}

function updateDirectorChart(data) {
    const labels = data.map(item => item.director);
    const revenues = data.map(item => item.ingresos_totales / 1000000);
    
    directorChart = createChart('directorRevenueChart', currentChartType, 'Ingresos (Millones USD)', labels, revenues, true);
}

// --- Actualizar estadísticas ---
function updateStats() {
    if (genreData && directorData) {
        const totalMovies = genreData.reduce((sum, item) => sum + item.conteo, 0);
        document.getElementById('totalMovies').textContent = totalMovies.toLocaleString();
        
        document.getElementById('totalGenres').textContent = genreData.length;
        
        if (directorData.length > 0) {
            document.getElementById('topDirector').textContent = directorData[0].director.split(' ').slice(0, 2).join(' ');
            const maxRevenue = (directorData[0].ingresos_totales / 1000000).toFixed(0);
            document.getElementById('topRevenue').textContent = '$' + maxRevenue + 'M';
        }
        
        animateNumbers();
    }
}

// --- Animación de números ---
function animateNumbers() {
    const statCards = document.querySelectorAll('.stat-card h3');
    statCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
    });
}

// --- Loading ---
function setLoading(isLoading) {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');
    
    if (isLoading) {
        loading.style.display = 'flex';
        mainContent.style.display = 'none';
    } else {
        loading.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.animation = 'fadeIn 0.8s ease';
    }
}

// --- Fetch data ---
async function fetchGenreData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reportes/top_generos`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        genreData = data;
        
        const limit = parseInt(document.getElementById('genreLimit').value);
        const filteredData = data.slice(0, limit);
        updateGenreChart(filteredData);
        
        return true;
    } catch (error) {
        console.error('Error al obtener datos de géneros:', error);
        showError('No se pudieron cargar los datos de géneros');
        return false;
    }
}

async function fetchDirectorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reportes/top_directores_ingresos`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        directorData = data;
        
        const limit = parseInt(document.getElementById('directorLimit').value);
        const filteredData = data.slice(0, limit);
        updateDirectorChart(filteredData);
        
        return true;
    } catch (error) {
        console.error('Error al obtener datos de directores:', error);
        showError('No se pudieron cargar los datos de directores');
        return false;
    }
}

// --- Refresh data ---
function refreshGenreData() {
    setLoading(true);
    fetchGenreData().then(() => {
        updateStats();
        setLoading(false);
    });
}

function refreshDirectorData() {
    setLoading(true);
    fetchDirectorData().then(() => {
        updateStats();
        setLoading(false);
    });
}

// --- Descargar gráfico ---
function downloadChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${canvasId}-${Date.now()}.png`;
    link.href = url;
    link.click();
}

// --- Búsqueda ---
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '<p style="color: var(--text-secondary);">Ingresa un término de búsqueda</p>';
        return;
    }
    
    const genreResults = genreData.filter(item => item.nombre.toLowerCase().includes(query));
    const directorResults = directorData.filter(item => item.director.toLowerCase().includes(query));
    
    let html = '';
    
    if (genreResults.length > 0) {
        html += '<h3 style="margin-bottom: 1rem;">Géneros encontrados:</h3>';
        genreResults.forEach(item => {
            html += `
                <div class="result-item">
                    <span><i class="fas fa-film"></i> ${item.nombre}</span>
                    <span><strong>${item.conteo}</strong> películas</span>
                </div>
            `;
        });
    }
    
    if (directorResults.length > 0) {
        html += '<h3 style="margin: 1.5rem 0 1rem;">Directores encontrados:</h3>';
        directorResults.forEach(item => {
            html += `
                <div class="result-item">
                    <span><i class="fas fa-user-tie"></i> ${item.director}</span>
                    <span><strong>$${(item.ingresos_totales / 1000000).toFixed(1)}M</strong></span>
                </div>
            `;
        });
    }
    
    if (genreResults.length === 0 && directorResults.length === 0) {
        html = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No se encontraron resultados</p>';
    }
    
    resultsDiv.innerHTML = html;
}

// --- Tabla de datos ---
let currentTableType = 'genres';

function showTable(type) {
    currentTableType = type;
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (type === 'genres') {
        updateTable('genres', genreData);
    } else {
        updateTable('directors', directorData);
    }
}

function updateTable(type, data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody || !data) return;
    
    const total = data.reduce((sum, item) => sum + (item.conteo || item.ingresos_totales), 0);
    
    let html = '';
    data.forEach((item, index) => {
        const value = item.conteo || item.ingresos_totales;
        const percentage = ((value / total) * 100).toFixed(1);
        const displayValue = item.conteo 
            ? `${item.conteo} películas`
            : `$${(item.ingresos_totales / 1000000).toFixed(1)}M`;
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${item.nombre || item.director}</strong></td>
                <td>${displayValue}</td>
                <td>
                    ${percentage}%
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// --- Error ---
function showError(message) {
    const mainContent = document.getElementById('mainContent');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        margin: 2rem auto;
        max-width: 500px;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <p style="margin-bottom: 1rem;">${message}</p>
        <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-refresh"></i> Reintentar
        </button>
    `;
    mainContent.appendChild(errorDiv);
}

// --- Cargar todos los datos ---
async function loadAllData() {
    setLoading(true);
    
    try {
        const [genresSuccess, directorsSuccess] = await Promise.all([
            fetchGenreData(),
            fetchDirectorData()
        ]);
        
        if (genresSuccess && directorsSuccess) {
            updateStats();
            updateTable('genres', genreData);
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
    } finally {
        setLoading(false);
    }
}

// --- Enter en búsqueda ---
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// --- Inicializar ---
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});