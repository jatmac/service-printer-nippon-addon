#include <napi.h>
#include <windows.h>
#include <string>
#include <vector>
#include <memory>

// NPrinterLib function prototypes
typedef INT (WINAPI *lpNEnumPrinters)(PWCHAR, PINT);
typedef INT (WINAPI *lpNOpenPrinter)(PWCHAR, BOOL, void*);
typedef INT (WINAPI *lpNClosePrinter)(PWCHAR);
typedef INT (WINAPI *lpNClosePrinters)();
typedef INT (WINAPI *lpNPrint)(PWCHAR, PCHAR, DWORD, PDWORD);
typedef INT (WINAPI *lpNImagePrint)(PWCHAR, HDC, INT, INT, BYTE, PDWORD);
typedef INT (WINAPI *lpNGetStatus)(PWCHAR, LPDWORD);
typedef INT (WINAPI *lpNGetInformation)(PWCHAR, BYTE, PVOID, PDWORD);
typedef INT (WINAPI *lpNResetPrinter)(PWCHAR, void*);
typedef INT (WINAPI *lpNStartDoc)(PWCHAR, PDWORD);
typedef INT (WINAPI *lpNEndDoc)(PWCHAR);
typedef INT (WINAPI *lpNCancelDoc)(PWCHAR);
typedef INT (WINAPI *lpNBarcode2)(HDC, DWORD, DWORD, PDWORD, PDWORD, PBYTE, DWORD);
typedef INT (WINAPI *lpNBarcodeSettings)(UINT, UINT, UINT, INT, INT, INT, INT, UINT, UINT, UINT);

// Global library handle and function pointers
static HMODULE g_hLibHandle = NULL;
static lpNEnumPrinters g_NEnumPrinters = NULL;
static lpNOpenPrinter g_NOpenPrinter = NULL;
static lpNClosePrinter g_NClosePrinter = NULL;
static lpNClosePrinters g_NClosePrinters = NULL;
static lpNPrint g_NPrint = NULL;
static lpNImagePrint g_NImagePrint = NULL;
static lpNGetStatus g_NGetStatus = NULL;
static lpNGetInformation g_NGetInformation = NULL;
static lpNResetPrinter g_NResetPrinter = NULL;
static lpNStartDoc g_NStartDoc = NULL;
static lpNEndDoc g_NEndDoc = NULL;
static lpNCancelDoc g_NCancelDoc = NULL;
static lpNBarcode2 g_NBarcode2 = NULL;
static lpNBarcodeSettings g_NBarcodeSettings = NULL;

// Helper: Load NPrinterLib.dll
bool LoadNPrinterLib() {
    if (g_hLibHandle != NULL) {
        return true; // Already loaded
    }

    g_hLibHandle = LoadLibraryW(L"NPrinterLib.dll");
    if (g_hLibHandle == NULL) {
        return false;
    }

    // Load function pointers
    g_NEnumPrinters = (lpNEnumPrinters)GetProcAddress(g_hLibHandle, "NEnumPrinters");
    g_NOpenPrinter = (lpNOpenPrinter)GetProcAddress(g_hLibHandle, "NOpenPrinter");
    g_NClosePrinter = (lpNClosePrinter)GetProcAddress(g_hLibHandle, "NClosePrinter");
    g_NClosePrinters = (lpNClosePrinters)GetProcAddress(g_hLibHandle, "NClosePrinters");
    g_NPrint = (lpNPrint)GetProcAddress(g_hLibHandle, "NPrint");
    g_NImagePrint = (lpNImagePrint)GetProcAddress(g_hLibHandle, "NImagePrint");
    g_NGetStatus = (lpNGetStatus)GetProcAddress(g_hLibHandle, "NGetStatus");
    g_NGetInformation = (lpNGetInformation)GetProcAddress(g_hLibHandle, "NGetInformation");
    g_NResetPrinter = (lpNResetPrinter)GetProcAddress(g_hLibHandle, "NResetPrinter");
    g_NStartDoc = (lpNStartDoc)GetProcAddress(g_hLibHandle, "NStartDoc");
    g_NEndDoc = (lpNEndDoc)GetProcAddress(g_hLibHandle, "NEndDoc");
    g_NCancelDoc = (lpNCancelDoc)GetProcAddress(g_hLibHandle, "NCancelDoc");
    g_NBarcode2 = (lpNBarcode2)GetProcAddress(g_hLibHandle, "NBarcode2");
    g_NBarcodeSettings = (lpNBarcodeSettings)GetProcAddress(g_hLibHandle, "NBarcodeSettings");

    return (g_NEnumPrinters != NULL && g_NOpenPrinter != NULL);
}

// Helper: Convert std::string to std::wstring
std::wstring StringToWString(const std::string& str) {
    if (str.empty()) return std::wstring();
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

// Helper: Convert std::wstring to std::string
std::string WStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

// N-API: EnumeratePrinters
Napi::Value EnumeratePrinters(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!LoadNPrinterLib()) {
        Napi::TypeError::New(env, "Failed to load NPrinterLib.dll").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (g_NEnumPrinters == NULL) {
        Napi::TypeError::New(env, "NEnumPrinters function not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get required buffer size
    INT bufferSize = 0;
    INT ret = g_NEnumPrinters(NULL, &bufferSize);
    
    if (ret != 0 || bufferSize == 0) {
        return Napi::Array::New(env, 0);
    }

    // Allocate buffer and get printer list
    std::vector<WCHAR> buffer(bufferSize);
    ret = g_NEnumPrinters(buffer.data(), &bufferSize);
    
    if (ret != 0) {
        Napi::TypeError::New(env, "Failed to enumerate printers").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Parse comma-separated printer names
    std::wstring printerList(buffer.data());
    std::vector<std::string> printers;
    
    size_t start = 0;
    size_t end = printerList.find(L',');
    
    while (end != std::wstring::npos) {
        std::wstring printer = printerList.substr(start, end - start);
        if (!printer.empty()) {
            printers.push_back(WStringToString(printer));
        }
        start = end + 1;
        end = printerList.find(L',', start);
    }
    
    // Add last printer
    if (start < printerList.length()) {
        std::wstring printer = printerList.substr(start);
        if (!printer.empty()) {
            printers.push_back(WStringToString(printer));
        }
    }

    // Convert to JS array
    Napi::Array result = Napi::Array::New(env, printers.size());
    for (size_t i = 0; i < printers.size(); i++) {
        result[i] = Napi::String::New(env, printers[i]);
    }

    return result;
}

// N-API: OpenPrinter
Napi::Value OpenPrinter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NOpenPrinter == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    INT ret = g_NOpenPrinter((PWCHAR)wPrinterName.c_str(), TRUE, NULL);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));

    return result;
}

// N-API: ClosePrinter
Napi::Value ClosePrinter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NClosePrinter == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    INT ret = g_NClosePrinter((PWCHAR)wPrinterName.c_str());

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));

    return result;
}

// N-API: Print
Napi::Value Print(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Printer name and data expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NPrint == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::string printData = info[1].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    DWORD jobId = 0;
    INT ret = g_NPrint((PWCHAR)wPrinterName.c_str(), (PCHAR)printData.c_str(), 
                      (DWORD)printData.length(), &jobId);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));
    result.Set("jobId", Napi::Number::New(env, jobId));

    return result;
}

// N-API: GetStatus
Napi::Value GetStatus(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NGetStatus == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    DWORD status = 0;
    INT ret = g_NGetStatus((PWCHAR)wPrinterName.c_str(), &status);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));
    result.Set("status", Napi::Number::New(env, status));

    return result;
}

// N-API: GetInformation
Napi::Value GetInformation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Printer name and info ID expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NGetInformation == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    BYTE infoId = (BYTE)info[1].As<Napi::Number>().Uint32Value();
    std::wstring wPrinterName = StringToWString(printerName);

    char buffer[65536] = {0};
    DWORD timeout = 5000;
    INT ret = g_NGetInformation((PWCHAR)wPrinterName.c_str(), infoId, buffer, &timeout);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));
    
    if (ret == 0) {
        result.Set("data", Napi::String::New(env, buffer));
        result.Set("timeout", Napi::Number::New(env, timeout));
    }

    return result;
}

// N-API: ResetPrinter
Napi::Value ResetPrinter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NResetPrinter == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    INT ret = g_NResetPrinter((PWCHAR)wPrinterName.c_str(), NULL);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));

    return result;
}

// N-API: StartDoc
Napi::Value StartDoc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NStartDoc == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    DWORD jobId = 0;
    INT ret = g_NStartDoc((PWCHAR)wPrinterName.c_str(), &jobId);

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));
    result.Set("jobId", Napi::Number::New(env, jobId));

    return result;
}

// N-API: EndDoc
Napi::Value EndDoc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NEndDoc == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    INT ret = g_NEndDoc((PWCHAR)wPrinterName.c_str());

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));

    return result;
}

// N-API: CancelDoc
Napi::Value CancelDoc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected for printer name").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!LoadNPrinterLib() || g_NCancelDoc == NULL) {
        Napi::TypeError::New(env, "NPrinterLib not available").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string printerName = info[0].As<Napi::String>().Utf8Value();
    std::wstring wPrinterName = StringToWString(printerName);

    INT ret = g_NCancelDoc((PWCHAR)wPrinterName.c_str());

    Napi::Object result = Napi::Object::New(env);
    result.Set("success", Napi::Boolean::New(env, ret == 0));
    result.Set("returnCode", Napi::Number::New(env, ret));

    return result;
}

// N-API wrapper functions
static Napi::Value EnumeratePrintersWrapper(const Napi::CallbackInfo& info) {
    return EnumeratePrinters(info);
}

static Napi::Value OpenPrinterWrapper(const Napi::CallbackInfo& info) {
    return OpenPrinter(info);
}

static Napi::Value ClosePrinterWrapper(const Napi::CallbackInfo& info) {
    return ClosePrinter(info);
}

static Napi::Value PrintWrapper(const Napi::CallbackInfo& info) {
    return Print(info);
}

static Napi::Value GetStatusWrapper(const Napi::CallbackInfo& info) {
    return GetStatus(info);
}

static Napi::Value GetInformationWrapper(const Napi::CallbackInfo& info) {
    return GetInformation(info);
}

static Napi::Value ResetPrinterWrapper(const Napi::CallbackInfo& info) {
    return ResetPrinter(info);
}

static Napi::Value StartDocWrapper(const Napi::CallbackInfo& info) {
    return StartDoc(info);
}

static Napi::Value EndDocWrapper(const Napi::CallbackInfo& info) {
    return EndDoc(info);
}

static Napi::Value CancelDocWrapper(const Napi::CallbackInfo& info) {
    return CancelDoc(info);
}

// Initialize the addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "enumeratePrinters"), Napi::Function::New(env, EnumeratePrintersWrapper));
    exports.Set(Napi::String::New(env, "openPrinter"), Napi::Function::New(env, OpenPrinterWrapper));
    exports.Set(Napi::String::New(env, "closePrinter"), Napi::Function::New(env, ClosePrinterWrapper));
    exports.Set(Napi::String::New(env, "print"), Napi::Function::New(env, PrintWrapper));
    exports.Set(Napi::String::New(env, "getStatus"), Napi::Function::New(env, GetStatusWrapper));
    exports.Set(Napi::String::New(env, "getInformation"), Napi::Function::New(env, GetInformationWrapper));
    exports.Set(Napi::String::New(env, "resetPrinter"), Napi::Function::New(env, ResetPrinterWrapper));
    exports.Set(Napi::String::New(env, "startDoc"), Napi::Function::New(env, StartDocWrapper));
    exports.Set(Napi::String::New(env, "endDoc"), Napi::Function::New(env, EndDocWrapper));
    exports.Set(Napi::String::New(env, "cancelDoc"), Napi::Function::New(env, CancelDocWrapper));

    return exports;
}

NODE_API_MODULE(nippon_printer, Init)
