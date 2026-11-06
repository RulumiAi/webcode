import {Component,Fragment,type ErrorInfo,type ReactNode} from 'react';
import {useLocale} from '../i18n';
import type {Locale} from '../types';
const copy:Record<Locale,[string,string,string]>={en:['This section could not be displayed.','Try again','Error details'],'zh-CN':['此区域暂时无法显示，请重试。','重新加载此区域','错误详情'],ja:['このセクションを表示できませんでした。','再試行','エラー詳細'],ko:['이 영역을 표시할 수 없습니다.','다시 시도','오류 세부 정보'],es:['No se pudo mostrar esta sección.','Reintentar','Detalles del error'],pt:['Não foi possível exibir esta seção.','Tentar novamente','Detalhes do erro']};
type Props={children:ReactNode;scope?:string;locale:Locale};
class ErrorBoundary extends Component<Props,{error:Error|null;attempt:number}>{
 declare props:Props;
 declare setState:(next:Partial<{error:Error|null;attempt:number}>|((state:{error:Error|null;attempt:number})=>Partial<{error:Error|null;attempt:number}>))=>void;
 state={error:null as Error|null,attempt:0};
 static getDerivedStateFromError(error:Error){return {error}}
 componentDidCatch(error:Error,info:ErrorInfo){try{localStorage.setItem('mio-last-render-error',JSON.stringify({version:'0.9.1',scope:this.props.scope||'app',time:new Date().toISOString(),message:error.message,stack:info.componentStack}))}catch{}}
 render(){if(!this.state.error)return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;const c=copy[this.props.locale];return <section className="mio-runtime-recovery" role="alert"><p>{c[0]}</p><button onClick={()=>this.setState(s=>({error:null,attempt:s.attempt+1}))}>{c[1]}</button><details><summary>{c[2]}</summary><pre>{this.state.error.message}</pre></details></section>}
}
export function RuntimeBoundary({children,scope}:{children:ReactNode;scope?:string;key?:string}){const {locale}=useLocale();return <ErrorBoundary locale={locale} scope={scope}>{children}</ErrorBoundary>}
