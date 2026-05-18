import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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
