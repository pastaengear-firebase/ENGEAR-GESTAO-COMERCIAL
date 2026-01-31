// src/components/common/seller-selector.tsx
"use client";
import { useSales } from '@/hooks/use-sales';
import { SELLERS, ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Seller } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

export default function SellerSelector() {
  const { selectedSeller, setSelectedSeller } = useSales();

  return (
    <div className="flex items-center space-x-2">
      <Users className="h-5 w-5 text-muted-foreground" />
      <Label htmlFor="seller-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Vendedor:
      </Label>
      <Select
        value={selectedSeller}
        onValueChange={(value) => setSelectedSeller(value as Seller | typeof ALL_SELLERS_OPTION)}
      >
        <SelectTrigger id="seller-select" className="w-[200px] bg-background hover:bg-muted transition-colors duration-150 focus:ring-primary">
          <SelectValue placeholder="Selecionar vendedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SELLERS_OPTION}>{ALL_SELLERS_OPTION}</SelectItem>
          {SELLERS.map((seller) => (
            <SelectItem key={seller} value={seller}>
              {seller}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
