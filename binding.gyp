{
  "targets": [
    {
      "target_name": "nippon_printer",
      "sources": [
        "src/binding.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "include"
      ],
      "libraries": [
        "-lwinspool"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "WIN32_LEAN_AND_MEAN",
        "_CRT_SECURE_NO_WARNINGS",
        "UNICODE",
        "_UNICODE"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "CharacterSet": 1
        }
      },
      "copies": [
        {
          "destination": "<(PRODUCT_DIR)",
          "files": [
            "<(module_root_dir)/lib/x64/NPrinterLib.dll",
            "<(module_root_dir)/lib/x64/NPrinterCLib.dll",
            "<(module_root_dir)/lib/x64/NBarCodeLib.dll"
          ]
        }
      ]
    }
  ]
}
