<script>
	import Slide from './Slide.svelte'
	import { words } from './content'

	let pos = 0

	const handleKeydown = (event) => {
		switch(event.key){
			case 'ArrowRight': pos = pos < words.length-1 ? pos +1 : 0; break;
			case 'ArrowLeft': pos = pos > 0 ? pos -1 : words.length -1; break;
		}
	}

	let show = true
	$: {
		pos //the reactive declaration is fired every time pos changes
		show = false
		setTimeout( () => show = true, 40)
	}
</script>

<svelte:window on:keydown={handleKeydown}/>
<main>
	{#if show}
		<Slide content={words[pos]}/>
	{:else}
		<p />
	{/if}
</main>


<style>
	main {
		display:grid;
		height:100vh;
		place-items:center;
	}
</style>