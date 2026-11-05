import ui from './it/ui.json'
import characters from './it/characters.json'
import quiz from './it/quiz.json'

// `quiz` esiste sia in ui.json (testi dell'interfaccia) sia in quiz.json (domande): vanno uniti, non sovrascritti.
export default { ...ui, characters, quiz: { ...ui.quiz, ...quiz } }
