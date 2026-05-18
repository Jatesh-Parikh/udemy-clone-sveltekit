import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
};

type FlyAndScaleParams = {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
};

export const FlyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        const valueB = percentage * (maxB - minB) + minB;

        return valueB;
    }

    const styleToString = (style: Record<string, number | string | undefined>): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, '');
    }

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            });
        },
        easing: cubicOut
    };
}

export function getDownloadUrl({
    collectionId,
    recordId,
    filename
}: {
    collectionId: string;
    recordId: string;
    filename: string;
}) {
    return `http://127.0.0.1:8090/api/files/${collectionId}/${recordId}/${filename}`;
};

export function formatCurrency(num: number) {
    if (isNaN(num)) {
        return;
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(num);
};

export function draggable(node: HTMLLIElement, options?: string) {
    let state = options;
    node.style.cursor = 'grab';
    node.draggable = true;

    function handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', state);
    }

    node.addEventListener('dragstart', handleDragStart);

    return {
        update(data) {
            state = data;
        },
        destroy() {
            node.removeEventListener("dragstart", handleDragStart);
        }
    }
};

export function dropZone(node: HTMLDivElement, options?: string) {
    let state = options;
    node.style.cursor = "grab";
    node.draggable = true;

    function handleDragStart(e) {
        e.dataTransfer.setData("text/plain", state);
    }
    node.addEventListener("dragstart", handleDragStart);

    return {
        update(data) {
            state = data;
        },
        destroy() {
            node.removeEventListener("dragstart", handleDragStart);
        }
    };
};
