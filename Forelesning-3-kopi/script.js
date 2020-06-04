import RickMorty from './data-kopi/rickmorty.js'
let inp = document.querySelector('#search')


console.log(RickMorty.results[0])

const showCharacter = (character) => {
    let characters = document.querySelector('#characters')
    let article = document.createElement('article')
    let h1 = document.createElement('h1')
    h1.innerHTML = character.name
    article.appendChild(h1)
    article.style.backgroundImage = `url(${character.image})`
    characters.appendChild(article)
}

RickMorty.results.map(
characters => showCharacter(characters)
)


const filter = () => {
    let characters = document.querySelector('#characters')
    characters.innerHTML = ''
    let newArray = RickMorty.results.filter(element => element.name.toLowerCase().includes(inp.value))
    newArray.map(element => showCharacter(element))
}

inp.addEventListener('input', filter)


