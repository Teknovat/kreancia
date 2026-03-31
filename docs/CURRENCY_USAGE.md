# 💰 Guide d'Utilisation Currency du Marchand

## 🎯 Vue d'ensemble

Le système de currency du marchand permet d'afficher automatiquement tous les montants dans la devise configurée pour chaque marchand (TND, EUR, USD, etc.).

## 📱 Utilisation côté Client (Composants React)

### Hook `useMerchantCurrency`

```typescript
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'

function PaymentCard({ amount }: { amount: number }) {
  const { formatAmount, currency, isLoading } = useMerchantCurrency()

  if (isLoading) {
    return <span>...</span>
  }

  return (
    <div>
      <span className="text-lg font-bold">
        {formatAmount(amount)}
      </span>
      <span className="text-sm text-gray-500">
        Currency: {currency}
      </span>
    </div>
  )
}
```

### Utilisation dans un tableau

```typescript
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'

function PaymentsList({ payments }: { payments: Payment[] }) {
  const { formatAmount, isLoading } = useMerchantCurrency()

  return (
    <table>
      <tbody>
        {payments.map(payment => (
          <tr key={payment.id}>
            <td>{payment.date}</td>
            <td>
              {isLoading ? '...' : formatAmount(payment.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## 🖥️ Utilisation côté Serveur

### Dans les composants Server

```typescript
import { formatCurrencyWithMerchantContext } from '@/lib/format-currency-server'

async function ServerPaymentCard({ amount }: { amount: number }) {
  const formattedAmount = await formatCurrencyWithMerchantContext(amount)

  return (
    <div>
      <span className="text-lg font-bold">
        {formattedAmount}
      </span>
    </div>
  )
}
```

### Dans les API routes

```typescript
import { getMerchantCurrency } from '@/lib/format-currency-server'
import { formatCurrency } from '@/lib/utils'

export async function GET() {
  const currency = await getMerchantCurrency()
  const amount = 1000
  
  return NextResponse.json({
    amount: amount,
    formatted: formatCurrency(amount, currency),
    currency: currency
  })
}
```

## 🔧 Migration depuis l'ancien système

### Ancien code (à migrer)

```typescript
// ❌ Ancien code avec currency hardcodée
<span>{payment.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>

// ❌ Utilisation de formatCurrency sans currency dynamique
<span>{formatCurrency(payment.amount)}</span>
```

### Nouveau code

```typescript
// ✅ Nouveau code avec currency du marchand
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'

function Component() {
  const { formatAmount } = useMerchantCurrency()
  
  return <span>{formatAmount(payment.amount)}</span>
}
```

## 📋 Checklist de Migration

### Pour les composants Client

- [ ] Importer `useMerchantCurrency` hook
- [ ] Remplacer les `formatCurrency(amount)` par `formatAmount(amount)`
- [ ] Supprimer les currency hardcodées ('EUR', 'TND', etc.)
- [ ] Ajouter le loading state si nécessaire

### Pour les composants Server

- [ ] Importer `formatCurrencyWithMerchantContext` ou `getMerchantCurrency`
- [ ] Utiliser `await formatCurrencyWithMerchantContext(amount)`
- [ ] Ou récupérer la currency avec `getMerchantCurrency()` puis utiliser `formatCurrency()`

## 🚀 API Endpoints

### GET /api/merchant/currency

Récupère la currency du marchand authentifié.

**Response:**
```json
{
  "success": true,
  "currency": "TND"
}
```

## 🔄 Fallbacks et Gestion d'Erreurs

- **Client non authentifié**: Currency par défaut `TND`
- **Erreur réseau**: Currency par défaut `TND`
- **Merchant sans currency**: Currency par défaut `TND`
- **Hook en loading**: Affiche `...` ou spinner

## ⚡ Performance

- Le hook `useMerchantCurrency` fait **1 seul appel API** par session
- La currency est **cachée** côté client après le premier appel
- **Pas de re-fetch** inutile grâce au `useEffect` avec dependencies vides

## 🧪 Testing

```typescript
// Test du hook
import { renderHook } from '@testing-library/react'
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'

// Mock de l'API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ currency: 'EUR' }),
  })
)

test('should format amount with merchant currency', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useMerchantCurrency())
  
  await waitForNextUpdate()
  
  expect(result.current.currency).toBe('EUR')
  expect(result.current.formatAmount(1000)).toBe('1 000,00 €')
})
```

---

**✨ Résultat**: Tous les montants sur le site s'affichent automatiquement dans la currency du marchand!