  
<script>
	import {apikeys} from '/Users/simo018/Documents/GitHub/00api_keys/apikeys.js'
	let ingredients = []
	let recipe
	$: console.log(ingredients.toString())
	const apikey = apikeys.spoonacular.api_key
	const getRecipes = () => {
		fetch(`https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apikey}&ingredients=${ingredients}&number=1`)
			.then(res=>res.json())
			.then(json => recipe=json[0])
	}
	const add = (e) => {
		e.target.checked ? ingredients = [...ingredients, e.target.id] : ingredients.filter(i => i!= e.target.id)
	}
</script>

<main>
	<h1>Hello cookie!</h1>
	<h3>Whats in the fridge?</h3>
	<label for="sugar">sukker</label>
	<input id='+sugar' type="checkbox" on:click={add}>
	<label for="flour">mel</label>
	<input id='+flour' type="checkbox" on:click={add}>
	<label for="apples">epler</label>
	<input id='+apples' type="checkbox" on:click={add}>
	<hr>
	<button on:click={getRecipes}>finn oppskrift</button>
	<hr>
	{#if recipe}
		<h1>{recipe.title}</h1>
		<img src="{recipe.image}" alt="{recipe.title}">
	{/if}

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>