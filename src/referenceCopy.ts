import {registerLocaleMessages} from './i18n';
import type {Locale} from './types';
const words:Record<Locale,string[]>={
 en:['Discover','Leaderboard','Create Image','Create Video','Create Characters','Task Center','Affiliate','My profile','Notifications','Events','Photo','Recent','Trending','Enter your fantasy…','Get the app','','No live rankings yet','Explore characters','Create your first character','Get started','Image and video generation are not connected in this preview.','App download is not available in this preview.','Payment options'],
 'zh-CN':['发现','排行榜','生成图片','生成视频','创建角色','任务中心','推广合作','个人中心','通知','活动','照片','最新','趋势','探索你的想象…','获取应用','','暂无真实榜单数据','探索角色','创建你的第一个角色','开始体验','当前预览尚未连接图片和视频生成服务。','当前预览暂不提供应用下载。','支付方式'],
 ja:['見つける','ランキング','画像を作成','動画を作成','キャラクター作成','タスクセンター','アフィリエイト','マイページ','通知','イベント','フォト','新着','トレンド','想像の世界へ…','アプリを入手','','ランキングデータはまだありません','キャラクターを探す','最初のキャラクターを作る','始める','このプレビューでは画像・動画生成サービスに接続していません。','このプレビューではアプリをダウンロードできません。','お支払い方法'],
 ko:['탐색','랭킹','이미지 만들기','동영상 만들기','캐릭터 만들기','미션 센터','제휴','마이페이지','알림','이벤트','사진','최신','트렌딩','상상 속으로 떠나보세요…','앱 다운로드','디자인 미리보기 · 샘플 콘텐츠','아직 실제 랭킹 데이터가 없습니다','캐릭터 탐색','첫 캐릭터 만들기','시작하기','이 미리보기에는 이미지 및 동영상 생성 서비스가 연결되어 있지 않습니다.','이 미리보기에서는 앱을 다운로드할 수 없습니다.','결제 방법'],
 es:['Descubrir','Clasificación','Crear imagen','Crear vídeo','Crear personajes','Misiones','Afiliados','Mi perfil','Notificaciones','Eventos','Fotos','Recientes','Tendencias','Explora tu imaginación…','Obtener la app','Vista previa · Contenido de ejemplo','Aún no hay clasificación real','Explorar personajes','Crea tu primer personaje','Comenzar','La generación de imágenes y vídeos no está conectada en esta vista previa.','La app no está disponible en esta vista previa.','Opciones de pago'],
 pt:['Descobrir','Ranking','Criar imagem','Criar vídeo','Criar personagens','Missões','Afiliados','Meu perfil','Notificações','Eventos','Fotos','Recentes','Em alta','Explore sua imaginação…','Baixar app','Prévia · Conteúdo de exemplo','Ainda não há ranking real','Explorar personagens','Crie seu primeiro personagem','Começar','A geração de imagens e vídeos não está conectada nesta prévia.','O app não está disponível nesta prévia.','Formas de pagamento']
};
export const referenceCopy=(locale:Locale)=>words[locale]||words.en;

registerLocaleMessages(Object.fromEntries(Object.entries(words).map(([locale,c])=>[locale,{'nav.profile':c[7]}])) as unknown as Record<Locale,Record<string,string>>);
