# Game Design Document (GDD) - Mini Handball 2D

## 1. Visión General del Proyecto

* **Nombre del juego:** Mini Handball 2D (Top-Down Arcade)
* **Género:** Deportivo / Arcade 2D
* **Plataforma:** Navegador Web (HTML5 Canvas + JavaScript ES6 + Tailwind CSS)
* **Público objetivo:** Jugadores casuales de juegos web rápidos estilo arcade.
* **Descripción breve:** Juego de balonmano en vista cenital (top-down) donde el jugador controla a un atacante que debe moverse por la pista, esquivar defensas y realizar lanzamientos a portería midiendo ángulo y potencia para superar al portero y batir el marcador.

---

## 2. Pilares de Diseño

1. **Accesibilidad e Inmediatez:** Sin instalaciones ni dependencias externas pesadas. Funciona en un solo archivo HTML en cualquier navegador.
2. **Física e Intuición:** Controles basados en ratón/teclado que responden con precisión al apuntado y cálculo de potencia.
3. **Fidelidad Arcade:** Incorpora las reglas esenciales del balonmano (como la prohibición de pisar el área de 6m) adaptadas a una jugabilidad rápida y adictiva.

---

## 3. Mecánicas de Juego (Gameplay)

### 3.1. Movimiento del Atacante
* **Entrada:** Control mediante teclado (`WASD` o `Flechas de Dirección`).
* **Límites:** 
  * Perímetro exterior de la pista.
  * **Línea de 6 Metros (Área de Portería):** Zona de exclusión estricta mediante física de colisión elíptica. El jugador no puede invadir esta área.

### 3.2. Sistema de Lanzamiento y Apuntado
* **Dirección:** El ángulo de tiro se calcula dinámicamente trazando una línea guía desde la posición del jugador hacia el cursor del ratón (o punto táctil).
* **Carga de Potencia:** 
  * Al mantener pulsado el `Clic Izquierdo` o la `Barra Espaciadora`, se activa una barra de potencia oscilante (0% a 100%).
  * Al soltar la tecla/botón, el balón sale disparado a una velocidad proporcional a la potencia cargada.

### 3.3. Inteligencia Artificial (IA)
* **Portero:** 
  * Desplazamiento lateral dentro de la portería.
  * Reacción ajustada a la trayectoria del tiro cuando el balón sobrevuela la zona de peligro.
* **Defensor:**
  * Cobertura horizontal en la zona de 9 metros para interceptar tiros desalineados o de baja potencia.

### 3.4. Sistema de Reglas y Puntuación
* **Gol:** El balón cruza completamente la línea de meta entre los postes y por debajo del larguero (+1 al marcador).
* **Parada / Bloqueo:** El balón entra en contacto con el cuerpo del portero o del defensor.
* **Poste / Larguero:** Rebound elástico realista al colisionar con los postes delimitadores.
* **Fuera:** El balón abandona los límites laterales o del fondo del campo sin entrar en portería.
* **Estadísticas registradas:** Goles encajados, lanzamientos totales e índice de efectividad (%).

---

## 4. Arquitectura Técnica

### 4.1. Framework y Motor
* **Lienzo Gráfico:** `<canvas>` HTML5 rendering en 2D a 60 FPS continuos mediante `requestAnimationFrame`.
* **Estilos & Layout:** Tailwind CSS (vía CDN) para paneles contenedores, tipografías e interfaz *glassmorphism*.

### 4.2. Sistema de Sonido (Web Audio API)
* **Sintetizador Audio Nativo:** Audio 100% generado por software mediante osciladores (`AudioContext`), sin depender de archivos `.mp3` o `.wav` externos.
* **Efectos programados:**
  * *Silbato:* Onda sinusoidal con caída rápida de frecuencia.
  * *Lanzamiento:* Onda triangular con rampa descendente modulada por la potencia del disparo.
  * *Gol:* Secuencia melódica de osciladores en arpegio ascendente.
  * *Parada / Bloqueo:* Modulación corta de ruido y frecuencia grave.
  * *Poste:* Onda cuadrada seca metálica.

### 4.3. Sistema Visual de Partículas
* Emisor de partículas 2D para efectos de retroalimentación:
  * Explosión verde al marcar gol.
  * Destello de impacto metálico al chocar con el poste.
  * Ráfagas de dispersión al ser atajado por el portero.

---

## 5. Interfaz de Usuario (UI/UX)

* **Panel Superior (Marcador):** Visualización clara de Goles, Tiros totales y % de Efectividad.
* **Controles de Interfaz:** Botón de reinicio rápido y selector *Mute/Unmute* para el audio.
* **Mensajes en Pantalla (Overlays):** Notificaciones flotantes animadas (*GOLAZO*, *PARADÓN*, *BLOQUEADO*, *AL POSTE*, *FUERA*).
* **Guía Visual de Apuntado:** Rayo láser discontinuo y retícula sobre el objetivo.

---

## 6. Hoja de Ruta y Posibles Ampliaciones (Roadmap)

* [x] **Fase 1 (MVP Actual):** Pista 2D top-down, movimiento del jugador, física de lanzamientos, IA de portero y defensor, marcador y sintetizador de sonido.
* [ ] **Fase 2:** Añadir efecto/rosca al balón arrastrando el ratón durante el tiro.
* [ ] **Fase 3:** Modo con temporizador (ej. partido de 2 minutos) y marcador de equipo rival.
* [ ] **Fase 4:** Multijugador local en el mismo teclado (P1 Atacante vs P2 Portero/Defensa).