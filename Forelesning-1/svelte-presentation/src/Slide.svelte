<script>
    import { scale } from 'svelte/transition'
    export let content
</script>

<div in:scale class='slide {content.title=='the end' && 'end'}' on:click={ () => content.link ? window.open(content.link): ''}>
    {#if content.title}
        <h1>{@html content.title}</h1>
    {/if}
    {#if content.text}
        <h2>{@html content.text}</h2>
    {/if}
    {#if content.img}
        <img src={content.img} alt='her er jeg'>
    {/if}
    {#if content.vid}
        <video autoplay muted>
            <source src="{content.vid}" type="video/mp4">
        </video>
    {/if}
</div>

<style>
    .end{
        background-color:black;
        height:60vh;
        border-radius:4px;
        box-shadow: 0 0 8px 2px lightgray;
    }
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
		text-align:center;
	}
    h2{
        font-weight:normal;
    }
    h1, h2{
        word-wrap: break-word;
    }

    :global(li){
        padding:.2rem;
    }
	.slide{
		width:80%;
		display:grid;
		align-items:center;
		justify-content:center;
	}
	img, video{
		width:100%;
	}
    @media (max-width: 640px) {
		h1 {
			font-size:2.2rem;
		}
        h2{
            font-size:1rem;
        }
        .slide{
            max-width:100vw;
            padding:2rem;
        }
	}

</style>