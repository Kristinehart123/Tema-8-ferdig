
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file = "src/App.svelte";

    // (50:1) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Press the button for a tasteful drink!";
    			attr_dev(h1, "id", "overskrift1");
    			attr_dev(h1, "class", "svelte-1ebqi0n");
    			add_location(h1, file, 50, 2, 2421);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(50:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:1) {#if drink}
    function create_if_block(ctx) {
    	let h1;
    	let t0_value = /*drink*/ ctx[0].strDrink + "";
    	let t0;
    	let t1;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t2;
    	let div1;
    	let h30;
    	let t4;
    	let p0;
    	let t5;
    	let t6_value = /*drink*/ ctx[0].strGlass + "";
    	let t6;
    	let t7;
    	let p1;

    	let t8_value = (/*drink*/ ctx[0].strMeasure1
    	? /*drink*/ ctx[0].strMeasure1
    	: "") + "";

    	let t8;
    	let t9;

    	let t10_value = (/*drink*/ ctx[0].strIngredient1
    	? /*drink*/ ctx[0].strIngredient1
    	: "") + "";

    	let t10;
    	let t11;
    	let p2;

    	let t12_value = (/*drink*/ ctx[0].strMeasure2
    	? /*drink*/ ctx[0].strMeasure2
    	: "") + "";

    	let t12;
    	let t13;

    	let t14_value = (/*drink*/ ctx[0].strIngredient2
    	? /*drink*/ ctx[0].strIngredient2
    	: "") + "";

    	let t14;
    	let t15;
    	let p3;

    	let t16_value = (/*drink*/ ctx[0].strMeasure3
    	? /*drink*/ ctx[0].strMeasure3
    	: "") + "";

    	let t16;
    	let t17;

    	let t18_value = (/*drink*/ ctx[0].strIngredient3
    	? /*drink*/ ctx[0].strIngredient3
    	: "") + "";

    	let t18;
    	let t19;
    	let p4;

    	let t20_value = (/*drink*/ ctx[0].strMeasure4
    	? /*drink*/ ctx[0].strMeasure4
    	: "") + "";

    	let t20;
    	let t21;

    	let t22_value = (/*drink*/ ctx[0].strIngredient4
    	? /*drink*/ ctx[0].strIngredient4
    	: "") + "";

    	let t22;
    	let t23;
    	let p5;

    	let t24_value = (/*drink*/ ctx[0].strMeasure5
    	? /*drink*/ ctx[0].strMeasure5
    	: "") + "";

    	let t24;
    	let t25;

    	let t26_value = (/*drink*/ ctx[0].strIngredient5
    	? /*drink*/ ctx[0].strIngredient5
    	: "") + "";

    	let t26;
    	let t27;
    	let p6;

    	let t28_value = (/*drink*/ ctx[0].strMeasure6
    	? /*drink*/ ctx[0].strMeasure6
    	: "") + "";

    	let t28;
    	let t29;

    	let t30_value = (/*drink*/ ctx[0].strIngredient6
    	? /*drink*/ ctx[0].strIngredient6
    	: "") + "";

    	let t30;
    	let t31;
    	let p7;

    	let t32_value = (/*drink*/ ctx[0].strMeasure7
    	? /*drink*/ ctx[0].strMeasure7
    	: "") + "";

    	let t32;
    	let t33;

    	let t34_value = (/*drink*/ ctx[0].strIngredient7
    	? /*drink*/ ctx[0].strIngredient7
    	: "") + "";

    	let t34;
    	let t35;
    	let p8;

    	let t36_value = (/*drink*/ ctx[0].strMeasure8
    	? /*drink*/ ctx[0].strMeasure8
    	: "") + "";

    	let t36;
    	let t37;

    	let t38_value = (/*drink*/ ctx[0].strIngredient8
    	? /*drink*/ ctx[0].strIngredient8
    	: "") + "";

    	let t38;
    	let t39;
    	let p9;

    	let t40_value = (/*drink*/ ctx[0].strMeasure9
    	? /*drink*/ ctx[0].strMeasure9
    	: "") + "";

    	let t40;
    	let t41;

    	let t42_value = (/*drink*/ ctx[0].strIngredient9
    	? /*drink*/ ctx[0].strIngredient9
    	: "") + "";

    	let t42;
    	let t43;
    	let p10;

    	let t44_value = (/*drink*/ ctx[0].strMeasure10
    	? /*drink*/ ctx[0].strMeasure10
    	: "") + "";

    	let t44;
    	let t45;

    	let t46_value = (/*drink*/ ctx[0].strIngredient10
    	? /*drink*/ ctx[0].strIngredient10
    	: "") + "";

    	let t46;
    	let t47;
    	let p11;

    	let t48_value = (/*drink*/ ctx[0].strMeasure11
    	? /*drink*/ ctx[0].strMeasure11
    	: "") + "";

    	let t48;
    	let t49;

    	let t50_value = (/*drink*/ ctx[0].strIngredient11
    	? /*drink*/ ctx[0].strIngredient11
    	: "") + "";

    	let t50;
    	let t51;
    	let p12;

    	let t52_value = (/*drink*/ ctx[0].strMeasure12
    	? /*drink*/ ctx[0].strMeasure12
    	: "") + "";

    	let t52;
    	let t53;

    	let t54_value = (/*drink*/ ctx[0].strIngredient12
    	? /*drink*/ ctx[0].strIngredient12
    	: "") + "";

    	let t54;
    	let t55;
    	let p13;

    	let t56_value = (/*drink*/ ctx[0].strMeasure13
    	? /*drink*/ ctx[0].strMeasure13
    	: "") + "";

    	let t56;
    	let t57;

    	let t58_value = (/*drink*/ ctx[0].strIngredient13
    	? /*drink*/ ctx[0].strIngredient13
    	: "") + "";

    	let t58;
    	let t59;
    	let p14;

    	let t60_value = (/*drink*/ ctx[0].strMeasure14
    	? /*drink*/ ctx[0].strMeasure14
    	: "") + "";

    	let t60;
    	let t61;

    	let t62_value = (/*drink*/ ctx[0].strIngredient14
    	? /*drink*/ ctx[0].strIngredient14
    	: "") + "";

    	let t62;
    	let t63;
    	let p15;

    	let t64_value = (/*drink*/ ctx[0].strMeasure15
    	? /*drink*/ ctx[0].strMeasure15
    	: "") + "";

    	let t64;
    	let t65;

    	let t66_value = (/*drink*/ ctx[0].strIngredient15
    	? /*drink*/ ctx[0].strIngredient15
    	: "") + "";

    	let t66;
    	let t67;
    	let h31;
    	let t69;
    	let p16;
    	let t70_value = /*drink*/ ctx[0].strInstructions + "";
    	let t70;
    	let t71;
    	let h32;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "This is what you need:";
    			t4 = space();
    			p0 = element("p");
    			t5 = text("Type of glass: ");
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			t8 = text(t8_value);
    			t9 = space();
    			t10 = text(t10_value);
    			t11 = space();
    			p2 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			t14 = text(t14_value);
    			t15 = space();
    			p3 = element("p");
    			t16 = text(t16_value);
    			t17 = space();
    			t18 = text(t18_value);
    			t19 = space();
    			p4 = element("p");
    			t20 = text(t20_value);
    			t21 = space();
    			t22 = text(t22_value);
    			t23 = space();
    			p5 = element("p");
    			t24 = text(t24_value);
    			t25 = space();
    			t26 = text(t26_value);
    			t27 = space();
    			p6 = element("p");
    			t28 = text(t28_value);
    			t29 = space();
    			t30 = text(t30_value);
    			t31 = space();
    			p7 = element("p");
    			t32 = text(t32_value);
    			t33 = space();
    			t34 = text(t34_value);
    			t35 = space();
    			p8 = element("p");
    			t36 = text(t36_value);
    			t37 = space();
    			t38 = text(t38_value);
    			t39 = space();
    			p9 = element("p");
    			t40 = text(t40_value);
    			t41 = space();
    			t42 = text(t42_value);
    			t43 = space();
    			p10 = element("p");
    			t44 = text(t44_value);
    			t45 = space();
    			t46 = text(t46_value);
    			t47 = space();
    			p11 = element("p");
    			t48 = text(t48_value);
    			t49 = space();
    			t50 = text(t50_value);
    			t51 = space();
    			p12 = element("p");
    			t52 = text(t52_value);
    			t53 = space();
    			t54 = text(t54_value);
    			t55 = space();
    			p13 = element("p");
    			t56 = text(t56_value);
    			t57 = space();
    			t58 = text(t58_value);
    			t59 = space();
    			p14 = element("p");
    			t60 = text(t60_value);
    			t61 = space();
    			t62 = text(t62_value);
    			t63 = space();
    			p15 = element("p");
    			t64 = text(t64_value);
    			t65 = space();
    			t66 = text(t66_value);
    			t67 = space();
    			h31 = element("h3");
    			h31.textContent = "This is how you make it:";
    			t69 = space();
    			p16 = element("p");
    			t70 = text(t70_value);
    			t71 = space();
    			h32 = element("h3");
    			h32.textContent = "Enjoy!";
    			attr_dev(h1, "id", "overskrift");
    			attr_dev(h1, "class", "svelte-1ebqi0n");
    			add_location(h1, file, 21, 2, 477);
    			if (img.src !== (img_src_value = /*drink*/ ctx[0].strDrinkThumb)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*drink*/ ctx[0].strDrink);
    			attr_dev(img, "class", "svelte-1ebqi0n");
    			add_location(img, file, 24, 3, 568);
    			attr_dev(div0, "class", "img svelte-1ebqi0n");
    			add_location(div0, file, 23, 2, 547);
    			attr_dev(h30, "class", "svelte-1ebqi0n");
    			add_location(h30, file, 27, 3, 658);
    			attr_dev(p0, "class", "svelte-1ebqi0n");
    			add_location(p0, file, 28, 3, 693);
    			attr_dev(p1, "class", "svelte-1ebqi0n");
    			add_location(p1, file, 29, 3, 735);
    			attr_dev(p2, "class", "svelte-1ebqi0n");
    			add_location(p2, file, 30, 3, 837);
    			attr_dev(p3, "class", "svelte-1ebqi0n");
    			add_location(p3, file, 31, 3, 939);
    			attr_dev(p4, "class", "svelte-1ebqi0n");
    			add_location(p4, file, 32, 3, 1041);
    			attr_dev(p5, "class", "svelte-1ebqi0n");
    			add_location(p5, file, 33, 3, 1143);
    			attr_dev(p6, "class", "svelte-1ebqi0n");
    			add_location(p6, file, 34, 3, 1245);
    			attr_dev(p7, "class", "svelte-1ebqi0n");
    			add_location(p7, file, 35, 3, 1347);
    			attr_dev(p8, "class", "svelte-1ebqi0n");
    			add_location(p8, file, 36, 3, 1449);
    			attr_dev(p9, "class", "svelte-1ebqi0n");
    			add_location(p9, file, 37, 3, 1551);
    			attr_dev(p10, "class", "svelte-1ebqi0n");
    			add_location(p10, file, 38, 3, 1653);
    			attr_dev(p11, "class", "svelte-1ebqi0n");
    			add_location(p11, file, 39, 3, 1759);
    			attr_dev(p12, "class", "svelte-1ebqi0n");
    			add_location(p12, file, 40, 3, 1865);
    			attr_dev(p13, "class", "svelte-1ebqi0n");
    			add_location(p13, file, 41, 3, 1971);
    			attr_dev(p14, "class", "svelte-1ebqi0n");
    			add_location(p14, file, 42, 3, 2077);
    			attr_dev(p15, "class", "svelte-1ebqi0n");
    			add_location(p15, file, 43, 3, 2183);
    			attr_dev(h31, "class", "svelte-1ebqi0n");
    			add_location(h31, file, 44, 3, 2289);
    			attr_dev(p16, "id", "directions");
    			attr_dev(p16, "class", "svelte-1ebqi0n");
    			add_location(p16, file, 45, 3, 2326);
    			attr_dev(h32, "class", "svelte-1ebqi0n");
    			add_location(h32, file, 46, 3, 2376);
    			attr_dev(div1, "class", "text svelte-1ebqi0n");
    			add_location(div1, file, 26, 2, 636);
    			attr_dev(div2, "class", "container svelte-1ebqi0n");
    			add_location(div2, file, 22, 2, 521);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    			append_dev(div1, t11);
    			append_dev(div1, p2);
    			append_dev(p2, t12);
    			append_dev(p2, t13);
    			append_dev(p2, t14);
    			append_dev(div1, t15);
    			append_dev(div1, p3);
    			append_dev(p3, t16);
    			append_dev(p3, t17);
    			append_dev(p3, t18);
    			append_dev(div1, t19);
    			append_dev(div1, p4);
    			append_dev(p4, t20);
    			append_dev(p4, t21);
    			append_dev(p4, t22);
    			append_dev(div1, t23);
    			append_dev(div1, p5);
    			append_dev(p5, t24);
    			append_dev(p5, t25);
    			append_dev(p5, t26);
    			append_dev(div1, t27);
    			append_dev(div1, p6);
    			append_dev(p6, t28);
    			append_dev(p6, t29);
    			append_dev(p6, t30);
    			append_dev(div1, t31);
    			append_dev(div1, p7);
    			append_dev(p7, t32);
    			append_dev(p7, t33);
    			append_dev(p7, t34);
    			append_dev(div1, t35);
    			append_dev(div1, p8);
    			append_dev(p8, t36);
    			append_dev(p8, t37);
    			append_dev(p8, t38);
    			append_dev(div1, t39);
    			append_dev(div1, p9);
    			append_dev(p9, t40);
    			append_dev(p9, t41);
    			append_dev(p9, t42);
    			append_dev(div1, t43);
    			append_dev(div1, p10);
    			append_dev(p10, t44);
    			append_dev(p10, t45);
    			append_dev(p10, t46);
    			append_dev(div1, t47);
    			append_dev(div1, p11);
    			append_dev(p11, t48);
    			append_dev(p11, t49);
    			append_dev(p11, t50);
    			append_dev(div1, t51);
    			append_dev(div1, p12);
    			append_dev(p12, t52);
    			append_dev(p12, t53);
    			append_dev(p12, t54);
    			append_dev(div1, t55);
    			append_dev(div1, p13);
    			append_dev(p13, t56);
    			append_dev(p13, t57);
    			append_dev(p13, t58);
    			append_dev(div1, t59);
    			append_dev(div1, p14);
    			append_dev(p14, t60);
    			append_dev(p14, t61);
    			append_dev(p14, t62);
    			append_dev(div1, t63);
    			append_dev(div1, p15);
    			append_dev(p15, t64);
    			append_dev(p15, t65);
    			append_dev(p15, t66);
    			append_dev(div1, t67);
    			append_dev(div1, h31);
    			append_dev(div1, t69);
    			append_dev(div1, p16);
    			append_dev(p16, t70);
    			append_dev(div1, t71);
    			append_dev(div1, h32);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*drink*/ 1 && t0_value !== (t0_value = /*drink*/ ctx[0].strDrink + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*drink*/ 1 && img.src !== (img_src_value = /*drink*/ ctx[0].strDrinkThumb)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*drink*/ 1 && img_alt_value !== (img_alt_value = /*drink*/ ctx[0].strDrink)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*drink*/ 1 && t6_value !== (t6_value = /*drink*/ ctx[0].strGlass + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*drink*/ 1 && t8_value !== (t8_value = (/*drink*/ ctx[0].strMeasure1
    			? /*drink*/ ctx[0].strMeasure1
    			: "") + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*drink*/ 1 && t10_value !== (t10_value = (/*drink*/ ctx[0].strIngredient1
    			? /*drink*/ ctx[0].strIngredient1
    			: "") + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*drink*/ 1 && t12_value !== (t12_value = (/*drink*/ ctx[0].strMeasure2
    			? /*drink*/ ctx[0].strMeasure2
    			: "") + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*drink*/ 1 && t14_value !== (t14_value = (/*drink*/ ctx[0].strIngredient2
    			? /*drink*/ ctx[0].strIngredient2
    			: "") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*drink*/ 1 && t16_value !== (t16_value = (/*drink*/ ctx[0].strMeasure3
    			? /*drink*/ ctx[0].strMeasure3
    			: "") + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*drink*/ 1 && t18_value !== (t18_value = (/*drink*/ ctx[0].strIngredient3
    			? /*drink*/ ctx[0].strIngredient3
    			: "") + "")) set_data_dev(t18, t18_value);

    			if (dirty & /*drink*/ 1 && t20_value !== (t20_value = (/*drink*/ ctx[0].strMeasure4
    			? /*drink*/ ctx[0].strMeasure4
    			: "") + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*drink*/ 1 && t22_value !== (t22_value = (/*drink*/ ctx[0].strIngredient4
    			? /*drink*/ ctx[0].strIngredient4
    			: "") + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*drink*/ 1 && t24_value !== (t24_value = (/*drink*/ ctx[0].strMeasure5
    			? /*drink*/ ctx[0].strMeasure5
    			: "") + "")) set_data_dev(t24, t24_value);

    			if (dirty & /*drink*/ 1 && t26_value !== (t26_value = (/*drink*/ ctx[0].strIngredient5
    			? /*drink*/ ctx[0].strIngredient5
    			: "") + "")) set_data_dev(t26, t26_value);

    			if (dirty & /*drink*/ 1 && t28_value !== (t28_value = (/*drink*/ ctx[0].strMeasure6
    			? /*drink*/ ctx[0].strMeasure6
    			: "") + "")) set_data_dev(t28, t28_value);

    			if (dirty & /*drink*/ 1 && t30_value !== (t30_value = (/*drink*/ ctx[0].strIngredient6
    			? /*drink*/ ctx[0].strIngredient6
    			: "") + "")) set_data_dev(t30, t30_value);

    			if (dirty & /*drink*/ 1 && t32_value !== (t32_value = (/*drink*/ ctx[0].strMeasure7
    			? /*drink*/ ctx[0].strMeasure7
    			: "") + "")) set_data_dev(t32, t32_value);

    			if (dirty & /*drink*/ 1 && t34_value !== (t34_value = (/*drink*/ ctx[0].strIngredient7
    			? /*drink*/ ctx[0].strIngredient7
    			: "") + "")) set_data_dev(t34, t34_value);

    			if (dirty & /*drink*/ 1 && t36_value !== (t36_value = (/*drink*/ ctx[0].strMeasure8
    			? /*drink*/ ctx[0].strMeasure8
    			: "") + "")) set_data_dev(t36, t36_value);

    			if (dirty & /*drink*/ 1 && t38_value !== (t38_value = (/*drink*/ ctx[0].strIngredient8
    			? /*drink*/ ctx[0].strIngredient8
    			: "") + "")) set_data_dev(t38, t38_value);

    			if (dirty & /*drink*/ 1 && t40_value !== (t40_value = (/*drink*/ ctx[0].strMeasure9
    			? /*drink*/ ctx[0].strMeasure9
    			: "") + "")) set_data_dev(t40, t40_value);

    			if (dirty & /*drink*/ 1 && t42_value !== (t42_value = (/*drink*/ ctx[0].strIngredient9
    			? /*drink*/ ctx[0].strIngredient9
    			: "") + "")) set_data_dev(t42, t42_value);

    			if (dirty & /*drink*/ 1 && t44_value !== (t44_value = (/*drink*/ ctx[0].strMeasure10
    			? /*drink*/ ctx[0].strMeasure10
    			: "") + "")) set_data_dev(t44, t44_value);

    			if (dirty & /*drink*/ 1 && t46_value !== (t46_value = (/*drink*/ ctx[0].strIngredient10
    			? /*drink*/ ctx[0].strIngredient10
    			: "") + "")) set_data_dev(t46, t46_value);

    			if (dirty & /*drink*/ 1 && t48_value !== (t48_value = (/*drink*/ ctx[0].strMeasure11
    			? /*drink*/ ctx[0].strMeasure11
    			: "") + "")) set_data_dev(t48, t48_value);

    			if (dirty & /*drink*/ 1 && t50_value !== (t50_value = (/*drink*/ ctx[0].strIngredient11
    			? /*drink*/ ctx[0].strIngredient11
    			: "") + "")) set_data_dev(t50, t50_value);

    			if (dirty & /*drink*/ 1 && t52_value !== (t52_value = (/*drink*/ ctx[0].strMeasure12
    			? /*drink*/ ctx[0].strMeasure12
    			: "") + "")) set_data_dev(t52, t52_value);

    			if (dirty & /*drink*/ 1 && t54_value !== (t54_value = (/*drink*/ ctx[0].strIngredient12
    			? /*drink*/ ctx[0].strIngredient12
    			: "") + "")) set_data_dev(t54, t54_value);

    			if (dirty & /*drink*/ 1 && t56_value !== (t56_value = (/*drink*/ ctx[0].strMeasure13
    			? /*drink*/ ctx[0].strMeasure13
    			: "") + "")) set_data_dev(t56, t56_value);

    			if (dirty & /*drink*/ 1 && t58_value !== (t58_value = (/*drink*/ ctx[0].strIngredient13
    			? /*drink*/ ctx[0].strIngredient13
    			: "") + "")) set_data_dev(t58, t58_value);

    			if (dirty & /*drink*/ 1 && t60_value !== (t60_value = (/*drink*/ ctx[0].strMeasure14
    			? /*drink*/ ctx[0].strMeasure14
    			: "") + "")) set_data_dev(t60, t60_value);

    			if (dirty & /*drink*/ 1 && t62_value !== (t62_value = (/*drink*/ ctx[0].strIngredient14
    			? /*drink*/ ctx[0].strIngredient14
    			: "") + "")) set_data_dev(t62, t62_value);

    			if (dirty & /*drink*/ 1 && t64_value !== (t64_value = (/*drink*/ ctx[0].strMeasure15
    			? /*drink*/ ctx[0].strMeasure15
    			: "") + "")) set_data_dev(t64, t64_value);

    			if (dirty & /*drink*/ 1 && t66_value !== (t66_value = (/*drink*/ ctx[0].strIngredient15
    			? /*drink*/ ctx[0].strIngredient15
    			: "") + "")) set_data_dev(t66, t66_value);

    			if (dirty & /*drink*/ 1 && t70_value !== (t70_value = /*drink*/ ctx[0].strInstructions + "")) set_data_dev(t70, t70_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:1) {#if drink}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let link;
    	let t0;
    	let header;
    	let button;
    	let t2;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*drink*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			link = element("link");
    			t0 = space();
    			header = element("header");
    			button = element("button");
    			button.textContent = "Give me a tasteful drink!";
    			t2 = space();
    			if_block.c();
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file, 15, 1, 251);
    			attr_dev(button, "class", "svelte-1ebqi0n");
    			add_location(button, file, 17, 2, 383);
    			attr_dev(header, "class", "svelte-1ebqi0n");
    			add_location(header, file, 16, 1, 372);
    			attr_dev(main, "class", "svelte-1ebqi0n");
    			add_location(main, file, 14, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, link);
    			append_dev(main, t0);
    			append_dev(main, header);
    			append_dev(header, button);
    			append_dev(main, t2);
    			if_block.m(main, null);
    			dispose = listen_dev(button, "click", /*givemeadrink*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let drink;

    	const givemeadrink = () => {
    		fetch(`https://www.thecocktaildb.com/api/json/v1/1/random.php`).then(res => res.json()).then(json => {
    			console.log(json);
    			$$invalidate(0, drink = json.drinks[0]);
    		});
    	};

    	$$self.$capture_state = () => ({ drink, givemeadrink, fetch, console });

    	$$self.$inject_state = $$props => {
    		if ("drink" in $$props) $$invalidate(0, drink = $$props.drink);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [drink, givemeadrink];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
