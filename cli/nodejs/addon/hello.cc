// hello.cc
#include <node.h>

#include <iostream>
// namespace demo {

void Parrot(const v8::FunctionCallbackInfo<v8::Value>& args) {
	v8::Isolate* isolate = args.GetIsolate();

	const int ac = args.Length();
	for (int i = 0; ac != i; ++i)
	{
		v8::String::Utf8Value v8_str(isolate, args[i]);
		std::string cpp_str(*v8_str);
		std::cout << cpp_str << std::endl;
	}

	args.GetReturnValue().Set(v8::String::NewFromUtf8(
		isolate, "world").ToLocalChecked());
}

void ForeverLoop(const v8::FunctionCallbackInfo<v8::Value>& args) {
	(void)args;
	while (1)
		void;
}

void Initialize(v8::Local<v8::Object> exports) {
  NODE_SET_METHOD(exports, "Parrot", Parrot);
  NODE_SET_METHOD(exports, "ForeverLoop", ForeverLoop);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

// }  // namespace demo 
