// ---------------------------------------------------------------------------
// Contenido del CV de Pau Díaz Masero convertido en lugares y diálogos.
// Cada "place" es un edificio del pueblo con un lugareño (NPC) al que se le
// pueden hacer las preguntas frecuentes de esa sección del currículum.
// ---------------------------------------------------------------------------

export const GAME_TITLE = "Villa Pau";
export const GAME_SUBTITLE = "El currículum jugable de Pau Díaz Masero";

export const CONTACT_LINKS = [
  {
    label: "LinkedIn",
    icon: "💼",
    url: "https://www.linkedin.com/in/pau-díaz-masero-3b328a102/",
  },
  {
    label: "GitHub",
    icon: "🐙",
    url: "https://github.com/pdiazmas",
  },
  {
    label: "Instagram",
    icon: "📷",
    url: "https://www.instagram.com/pau_diaaz_/",
  },
];

// facing: dirección hacia la que mira la puerta ("N" = -z, "S" = +z, "E" = +x, "W" = -x)
export const PLACES = [
  {
    id: "casa",
    name: "Casa de Pau",
    sign: "🏡 Casa de Pau",
    position: [0, 34],
    facing: "N",
    size: { w: 10, d: 8, h: 4, roofH: 2.6 },
    colors: { wall: 0xf2e3c6, roof: 0xb0533c, door: 0x6e4a2f },
    chimney: true,
    interior: "casa",
    npc: {
      name: "Pau",
      role: "Sobre mí",
      palette: { shirt: 0x3f6fb5, pants: 0x2e3a4d, skin: 0xf0c39b, hair: 0x4a3223 },
      greeting:
        "¡Hola! 👋 Bienvenido a mi casa. Soy Pau Díaz Masero, el alcalde... bueno, el dueño de este pueblo. Pregúntame lo que quieras, ¡para eso has venido!",
      bye: "¡Gracias por la visita! Explora el resto del pueblo, cada edificio cuenta una parte de mi historia.",
      questions: [
        {
          q: "¿Quién eres?",
          a: "Soy Técnico Superior en Imagen para el Diagnóstico, Enfermero y futuro Ingeniero Informático. Un poco de ciencia, un poco de cuidados y un poco de código.",
        },
        {
          q: "¿En qué trabajas ahora mismo?",
          a: "Actualmente trabajo como Técnico en Imagen para el Diagnóstico y como Enfermero. Y entre turno y turno sigo estudiando Ingeniería Informática en la UOC.",
        },
        {
          q: "¿Qué haces cuando no trabajas?",
          a: "Más allá de la informática y la salud, soy autor, redactor y lector profesional. Si te interesan mis historias, pásate por la Biblioteca del pueblo. 📚",
        },
        {
          q: "¿Por qué tu CV es un pueblo?",
          a: "Porque un currículum también puede ser un lugar que se recorre. En el Hospital te hablarán de mi experiencia, en la Universidad de mis estudios, en el Café de mis idiomas... ¡Visítalo todo!",
        },
      ],
    },
  },
  {
    id: "hospital",
    name: "Hospital",
    sign: "🏥 Hospital",
    position: [-22, -26],
    facing: "S",
    size: { w: 14, d: 10, h: 5, roofH: 2.4 },
    colors: { wall: 0xf4f6f5, roof: 0xd9534f, door: 0x9fb7c9 },
    emblem: "cross",
    interior: "hospital",
    npc: {
      name: "Dra. Vidal",
      role: "Experiencia laboral",
      palette: { shirt: 0xfafafa, pants: 0x9fc7d9, skin: 0xe8b48c, hair: 0x2b2b2b },
      greeting:
        "Bienvenido al hospital. Aquí conocemos bien a Pau: ha pasado muchas horas entre radiografías y pacientes. ¿Qué quieres saber de su experiencia?",
      bye: "¡Cuídate! Y si algún día necesitas una radiografía, ya sabes quién la hará con mimo.",
      questions: [
        {
          q: "¿Dónde trabaja Pau actualmente?",
          a: "Desde septiembre de 2022 trabaja en el CAP Tàrrega como Técnico en Imagen para el Diagnóstico, realizando radiología simple de urgencias. 🩻",
        },
        {
          q: "¿Qué experiencia tiene en diagnóstico por imagen?",
          a: "En el Hospital Universitari Santa Maria (2021) realizó resonancias magnéticas, radiología simple, ecografías y técnicas de imagen en quirófano. Antes, en sus prácticas de 2019, trabajó en el Niels-Stensen Kliniken Marienhospital de Osnabrück (Alemania) y en la Clínica Vithas de Lleida, donde también hizo fluoroscopia.",
        },
        {
          q: "¿Y como enfermero?",
          a: "Entre 2020 y 2024 realizó sus prácticas clínicas de Enfermería en el Hospital Universitari d'Igualada, el Hospital Sagrat Cor y los CAP de Piera y Montbui: enfermería comunitaria, de salud mental, hospitalaria y gerontológica.",
        },
      ],
    },
  },
  {
    id: "universidad",
    name: "Universidad",
    sign: "🎓 Universidad",
    position: [20, -26],
    facing: "S",
    size: { w: 14, d: 10, h: 5.5, roofH: 2.6 },
    colors: { wall: 0xd8b78e, roof: 0x5d6d7e, door: 0x5a3d26 },
    interior: "universidad",
    npc: {
      name: "Prof. Ferrer",
      role: "Educación",
      palette: { shirt: 0x7d5a44, pants: 0x3d3d3d, skin: 0xf0c39b, hair: 0xbfbfbf },
      greeting:
        "¡Ah, un visitante curioso! Pau ha sido buen alumno por aquí... y todavía no ha terminado de estudiar. ¿Qué quieres consultar de su expediente?",
      bye: "Recuerda: nunca se deja de aprender. ¡Hasta pronto!",
      questions: [
        {
          q: "¿Qué estudios tiene Pau?",
          a: "Es Graduado en Enfermería por la Universitat de Lleida (2020-2024) y Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear por el IES Torrevicens de Lleida (2018-2020). Además, estudia Ingeniería Informática en la UOC.",
        },
        {
          q: "Háblame del Grado en Enfermería",
          a: "Formado en la atención integral al paciente, desarrolló habilidades en valoración de pacientes, administración de tratamientos y colaboración en equipos interdisciplinarios. También participó en programas de promoción de la salud, aplicando principios éticos y de calidad en todas sus intervenciones.",
        },
        {
          q: "¿Y el ciclo de Imagen para el Diagnóstico?",
          a: "Se especializó en la obtención y procesamiento de imágenes diagnósticas: manejo de equipos de radiología, tomografía computarizada (TC) y resonancia magnética (RM), preparación de pacientes, control de calidad de imágenes y protocolos de seguridad radiológica.",
        },
        {
          q: "¿Está estudiando algo ahora?",
          a: "Sí: Ingeniería Informática en la Universitat Oberta de Catalunya desde 2020. Programación, diseño de sistemas, bases de datos, redes... con Java, C, HTML, CSS, UML, seguridad informática y metodologías ágiles.",
        },
      ],
    },
  },
  {
    id: "biblioteca",
    name: "Biblioteca",
    sign: "📚 Biblioteca",
    position: [-32, 2],
    facing: "E",
    size: { w: 11, d: 9, h: 4.5, roofH: 2.4 },
    colors: { wall: 0xc9a37c, roof: 0x7a5230, door: 0x4a3220 },
    interior: "biblioteca",
    npc: {
      name: "Marc, el bibliotecario",
      role: "Faceta literaria",
      palette: { shirt: 0x556b2f, pants: 0x4a4034, skin: 0xead1b0, hair: 0x6b4a2f },
      greeting:
        "Shhh... bienvenido a la biblioteca. 📖 ¿Vienes buscando las historias de Pau? Estás en el lugar adecuado.",
      bye: "Que las buenas historias te acompañen. Shhh...",
      questions: [
        {
          q: "¿Pau escribe?",
          a: "Sí: es autor, redactor y lector profesional. Las letras son su tercera vocación, después de la salud y el código.",
        },
        {
          q: "¿Dónde puedo leer algo suyo?",
          a: "Sus proyectos literarios llegarán muy pronto a estas estanterías. Vuelve a visitarnos... o pregúntale directamente: vive en la casa al sur de la plaza.",
        },
      ],
    },
  },
  {
    id: "taller",
    name: "Taller Tech",
    sign: "💻 Taller Tech",
    position: [32, 0],
    facing: "W",
    size: { w: 11, d: 9, h: 4.5, roofH: 2.2 },
    colors: { wall: 0x8fa5b5, roof: 0x3b4a5a, door: 0x2f3b47 },
    interior: "taller",
    npc: {
      name: "Nora, la desarrolladora",
      role: "Proyectos",
      palette: { shirt: 0x8e44ad, pants: 0x2c3e50, skin: 0xd9a67c, hair: 0x1f1f1f },
      greeting:
        "¡Cuidado con los cables! Bienvenido al taller. Aquí es donde Pau trastea con el código. 💻 ¿Qué quieres saber?",
      bye: "¡Nos vemos! Voy a seguir compilando...",
      questions: [
        {
          q: "¿Qué proyectos web tiene?",
          a: "Están en el horno 🍞... pero estás dentro de uno ahora mismo: este pueblo en 3D es su currículum, construido a mano con Three.js y JavaScript, sin plantillas ni motores externos.",
        },
        {
          q: "¿Qué tecnologías maneja?",
          a: "HTML, CSS, XML, Java, C, UML, Joomla, redes, Windows y Linux, montaje de equipos y seguridad informática... y sigue sumando con el grado de Ingeniería Informática de la UOC.",
        },
        {
          q: "¿Hace trabajos freelance?",
          a: "Acepta encargos, sí. Si tienes un proyecto en mente, pásate por la Oficina de Correos del pueblo y envíale un mensaje. 📬",
        },
      ],
    },
  },
  {
    id: "cafe",
    name: "Café Políglota",
    sign: "☕ Café Políglota",
    position: [-20, 26],
    facing: "N",
    size: { w: 11, d: 9, h: 4, roofH: 2.4 },
    colors: { wall: 0xa8574e, roof: 0x4f3222, door: 0x3a2417 },
    chimney: true,
    interior: "cafe",
    npc: {
      name: "Marta, la camarera",
      role: "Idiomas",
      palette: { shirt: 0xd35400, pants: 0x5d4037, skin: 0xf0c39b, hair: 0x8c3b2e },
      greeting:
        "¡Bienvenido al Café Políglota! ☕ Aquí cada mesa habla un idioma distinto. A Pau le encanta este sitio: puede sentarse en casi todas.",
      bye: "Tschüss! Goodbye! Adeu! ¡Adiós! ...perdona, deformación profesional.",
      questions: [
        {
          q: "¿Qué idiomas habla Pau?",
          a: "Cuatro: español y catalán como lenguas nativas, inglés a nivel C2 y alemán a nivel B2.",
        },
        {
          q: "¿Alemán? ¿En serio?",
          a: "¡En serio! Lo perfeccionó trabajando en el Marienhospital de Osnabrück, en Alemania. No hay mejor academia que un hospital alemán a las 7 de la mañana.",
        },
        {
          q: "¿Y el inglés?",
          a: "Nivel C2. Lo usa a diario para estudiar, leer documentación técnica y devorar novelas en versión original.",
        },
      ],
    },
  },
  {
    id: "correos",
    name: "Oficina de Correos",
    sign: "📮 Correos",
    position: [20, 26],
    facing: "N",
    size: { w: 10, d: 8, h: 4, roofH: 2.2 },
    colors: { wall: 0xe8c15a, roof: 0x8a6d3b, door: 0x5a4324 },
    interior: "correos",
    npc: {
      name: "Quim, el cartero",
      role: "Contacto",
      palette: { shirt: 0xf1c40f, pants: 0x34495e, skin: 0xe8b48c, hair: 0x3d2b1f },
      greeting:
        "¡Buenas! Por aquí pasan todas las cartas del pueblo. ¿Quieres enviarle un mensaje a Pau? Has venido al sitio correcto. 📬",
      bye: "¡Que llegue bien tu mensaje! El servicio postal de Villa Pau nunca falla.",
      questions: [
        {
          q: "¿Cómo puedo contactar con Pau?",
          a: "Muy fácil: elige tu paloma mensajera favorita. 🕊️ Estas son sus redes:",
          links: CONTACT_LINKS,
        },
        {
          q: "¿Está abierto a nuevas oportunidades?",
          a: "Siempre escucha propuestas interesantes, sobre todo si mezclan salud y tecnología. Lo más rápido es escribirle por LinkedIn.",
          links: [CONTACT_LINKS[0]],
        },
      ],
    },
  },
];

export const WELCOME_SIGN =
  "Bienvenido a VILLA PAU\nEl currículum jugable de\nPau Díaz Masero\n\nHabla con los lugareños 💬";
