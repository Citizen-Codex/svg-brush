import type { BrushDefinition } from '$lib/BrushGeometry.js';
import { type DeformationOptions } from '$lib/BackboneDeformation.js';
import { type Point } from '$lib/PathMath.js';
interface Props {
	width?: number;
	height?: number;
	brush?: BrushDefinition;
	deformationOptions?: Partial<DeformationOptions>;
	backgroundColor?: string;
	showGrid?: boolean;
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
declare const SvgCanvas: $$__sveltets_2_IsomorphicComponent<
	Props,
	{
		strokeStart: CustomEvent<{
			point: Point;
			brush: BrushDefinition;
		}>;
		strokeUpdate: CustomEvent<{
			path: Point[];
			brush: BrushDefinition;
		}>;
		strokeEnd: CustomEvent<{
			pathString: string;
			brush: BrushDefinition;
		}>;
	} & {
		[evt: string]: CustomEvent<any>;
	},
	{},
	{
		clearCanvas: () => void;
		undo: () => void;
		exportSVG: () => string;
	},
	''
>;
type SvgCanvas = InstanceType<typeof SvgCanvas>;
export default SvgCanvas;
