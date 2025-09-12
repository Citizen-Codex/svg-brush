import { type BrushDefinition } from '$lib/BrushGeometry.js';
interface Props {
	selectedBrush?: BrushDefinition;
	showPreview?: boolean;
	previewSize?: number;
}
interface $$__sveltets_2_IsomorphicComponent<
	Props extends Record<string, any> = any,
	Events extends Record<string, any> = any,
	Slots extends Record<string, any> = any,
	Exports = {},
	Bindings = string
> {
	new (
		options: import('svelte').ComponentConstructorOptions<Props>
	): import('svelte').SvelteComponent<Props, Events, Slots> & {
		$$bindings?: Bindings;
	} & Exports;
	(
		internal: unknown,
		props: Props & {
			$$events?: Events;
			$$slots?: Slots;
		}
	): Exports & {
		$set?: any;
		$on?: any;
	};
	z_$$bindings?: Bindings;
}
declare const BrushSelector: $$__sveltets_2_IsomorphicComponent<
	Props,
	{
		brushChanged: CustomEvent<BrushDefinition>;
		brushScaleChanged: CustomEvent<{
			brush: BrushDefinition;
			scale: number;
		}>;
	} & {
		[evt: string]: CustomEvent<any>;
	},
	{},
	{},
	''
>;
type BrushSelector = InstanceType<typeof BrushSelector>;
export default BrushSelector;
