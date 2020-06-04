<script>
	let drink
	const givemeadrink = () => {
		fetch(`https://www.thecocktaildb.com/api/json/v1/1/random.php`)
			.then( res => res.json() )
				.then( json => {
					console.log(json)
					drink = json.drinks[0]
		
				})
	}
</script>


<main>

	<header>
		<button on:click={givemeadrink}>Give me a tasteful drink!</button>
	</header>

	{#if drink}
		<h1 id="overskrift">{drink.strDrink}</h1>
		<div class="container">
		<div class="img">
			<img src="{drink.strDrinkThumb}" alt="{drink.strDrink}">
		</div>
		<div class="text">
			<h3>This is what you need:</h3>
			<p>Type of glass: {drink.strGlass}</p>
			<p>{drink.strMeasure1 ? drink.strMeasure1:''} {drink.strIngredient1 ? drink.strIngredient1:''}</p>
			<p>{drink.strMeasure2 ? drink.strMeasure2:''} {drink.strIngredient2 ? drink.strIngredient2:''}</p>
			<p>{drink.strMeasure3 ? drink.strMeasure3:''} {drink.strIngredient3 ? drink.strIngredient3:''}</p>
			<p>{drink.strMeasure4 ? drink.strMeasure4:''} {drink.strIngredient4 ? drink.strIngredient4:''}</p>
			<p>{drink.strMeasure5 ? drink.strMeasure5:''} {drink.strIngredient5 ? drink.strIngredient5:''}</p>
			<p>{drink.strMeasure6 ? drink.strMeasure6:''} {drink.strIngredient6 ? drink.strIngredient6:''}</p>
			<p>{drink.strMeasure7 ? drink.strMeasure7:''} {drink.strIngredient7 ? drink.strIngredient7:''}</p>
			<p>{drink.strMeasure8 ? drink.strMeasure8:''} {drink.strIngredient8 ? drink.strIngredient8:''}</p>
			<p>{drink.strMeasure9 ? drink.strMeasure9:''} {drink.strIngredient9 ? drink.strIngredient9:''}</p>
			<p>{drink.strMeasure10 ? drink.strMeasure10:''} {drink.strIngredient10 ? drink.strIngredient10:''}</p>
			<p>{drink.strMeasure11 ? drink.strMeasure11:''} {drink.strIngredient11 ? drink.strIngredient11:''}</p>
			<p>{drink.strMeasure12 ? drink.strMeasure12:''} {drink.strIngredient12 ? drink.strIngredient12:''}</p>
			<p>{drink.strMeasure13 ? drink.strMeasure13:''} {drink.strIngredient13 ? drink.strIngredient13:''}</p>
			<p>{drink.strMeasure14 ? drink.strMeasure14:''} {drink.strIngredient14 ? drink.strIngredient14:''}</p>
			<p>{drink.strMeasure15 ? drink.strMeasure15:''} {drink.strIngredient15 ? drink.strIngredient15:''}</p>
			<h3>This is how you make it:</h3>
			<p id="directions">{drink.strInstructions}</p>
			<h3>Enjoy!</h3>
		</div>
		</div>
	{:else}
		<h1 id="overskrift1">Press the button for a tasteful drink!</h1>
	{/if}
</main>

<style>
	:global(body){
		background-color: #010100;
	}	
	p {
		color: #FDB750;
		margin-top: -15px;
	}
	h3 {
		color: #FD7F20;
	}
	main {
		padding: 10vw;
	}
	h1 {
		color: #FD7F20;
		font-size: 4em;
		font-weight: 100;
		text-align: center;
	}
	#overskrift1 {
		text-transform: uppercase;
	}
	button {
		color: #eee;
		background-color: #FD7F20;
		border: none;
	}
	button:hover {
		color: #ffffff !important;
		background: #FC2E20;
		border-color: #FC2E20 !important;
		transition: all 0.4s ease 0s;
	}

	header {
		text-align: center;
	}
	.container{
		display: flex;
		align-items: center;
	}
	img{
		max-width: 100%;
	} 
	 .img{
		flex-basis: 60%;
	}
	.text{
		flex-basis: 70%;
	}
	#directions{
  	overflow-wrap: break-word;
	}

	/* @media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>