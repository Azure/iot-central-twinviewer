import * as React from 'react';
// import * as JS from 'jsoneditor';
// import 'jsoneditor/dist/jsoneditor.css';

export class Json extends React.Component<any> {

    // private myRef: any = null;


    // constructor(props: any) {
    //     super(props)
    //     this.myRef = React.createRef();
    //     this.state = {
    //         editor: {},
    //         options: {
    //             mode: 'code',
    //             mainMenuBar: false,
    //             navigationBar: false,
    //             statusBar: true,
    //             onChange: this.callback
    //         }
    //     }

    //     if (this.props.liveUpdate) {
    //         this.state.options['onEditable'] = (node) => {
    //             if (!node.path) { return false; }
    //         }
    //     }
    // }

    // componentDidMount() {
    //     const container = this.myRef.current;
    //     // eslint-disable-next-line
    //     this.state.editor = new JS(container, this.state.options);
    //     // eslint-disable-next-line
    //     this.state.editor.set(this.props.json || {});
    // }

    // // this is set to false as to not trigger updates whilst authoring JSON
    // shouldComponentUpdate(nextProps) {
    //     if (this.props.liveUpdate) {
    //         this.state.editor.set(nextProps.json || {});
    //         return true;
    //     }
    //     return false;
    // }

    // componentWillUnmount() {
    //     if (this.state.editor) {
    //         this.state.editor.destroy();
    //         // eslint-disable-next-line
    //         this.state.editor = null;
    //     }
    // }

    // callback = () => {
    //     let text = '';
    //     try {
    //         text = this.state.editor.get()
    //         if (this.props.onChange) { this.props.onChange(text); }
    //     } catch { }
    // }

    render() {
        //return <div ref={this.myRef} className={this.props.className}></div>
        return <h1>Editor</h1>
    }
}
