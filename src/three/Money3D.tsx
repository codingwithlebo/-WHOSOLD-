import type { ThreeElements } from '@react-three/fiber'
import { getMoneyAssets } from './moneyAssets'

type GroupProps = ThreeElements['group']

/** A minted R5-style coin: embossed faces and a reeded edge. */
export function Coin3D(props: GroupProps) {
  const { coinGeometry, coinMaterials } = getMoneyAssets()
  return (
    <group {...props}>
      <mesh geometry={coinGeometry} material={coinMaterials} />
    </group>
  )
}

/** A single, slightly curved banknote with a different front and back. */
export function Banknote(props: GroupProps) {
  const { noteGeometry, noteFront, noteBack } = getMoneyAssets()
  return (
    <group {...props}>
      <mesh geometry={noteGeometry} material={noteFront} />
      <mesh geometry={noteGeometry} material={noteBack} rotation-y={Math.PI} />
    </group>
  )
}

/** A strapped bundle of banknotes. */
export function Bundle(props: GroupProps) {
  const { bundleGeometry, bundleMaterials, bandGeometry, bandMaterial } =
    getMoneyAssets()
  return (
    <group {...props}>
      <mesh geometry={bundleGeometry} material={bundleMaterials} />
      <mesh geometry={bandGeometry} material={bandMaterial} />
    </group>
  )
}
